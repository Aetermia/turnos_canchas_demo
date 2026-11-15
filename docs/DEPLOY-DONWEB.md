# Despliegue en DonWeb (FTP + phpMyAdmin, sin SSH)

Guía operativa para instalar y actualizar una copia del sistema en **DonWeb Web Hosting Emprendedor (Linux)**. No requiere SSH, Composer ni Node en el servidor.

## 0. Antes de tocar el hosting

Confirmá en el panel Ferozo:

- PHP **8.4** seleccionado para el dominio (Laravel 13 exige 8.3 o superior).
- Extensiones: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, `curl`, `zip`, `bcmath`.
- MySQL 8.x y credenciales de la base.
- Si el panel permite **cambiar el document root**, usá la opción A (preferida).

Todo lo que sigue se prepara **en tu máquina**. En el servidor solo se sube archivos y se importa SQL.

## 1. Preparar el paquete de producción

```bash
# en la raíz del repositorio
cd app
php ../composer.phar install --no-dev --optimize-autoloader
npm ci
npm run build
```

No subas `node_modules/`, `.git/`, `tests/` ni `database/database.sqlite`.

## 2. Subir los archivos

### Opción A: el dominio apunta a la carpeta `public` (preferida)

1. Subí todo el proyecto a `/home/USUARIO/canchas/`.
2. En Ferozo, configurá el document root del dominio a `/home/USUARIO/canchas/public`.

El `.env`, `vendor/` y `storage/` quedan fuera del alcance web, que es el objetivo.

### Opción B: el document root es fijo (`public_html`)

1. Subí el proyecto a `/home/USUARIO/canchas/`.
2. Copiá el **contenido** de `canchas/public/` dentro de `public_html/`.
3. En `public_html/index.php`, corregí las dos rutas:

```php
require __DIR__.'/../canchas/vendor/autoload.php';
$app = require_once __DIR__.'/../canchas/bootstrap/app.php';
```

4. Subí `canchas/public/build/` a `public_html/build/`.
5. Borrá `public_html/index.html` y cualquier archivo de ejemplo del hosting.

`public_html` queda conteniendo solo el índice, los assets compilados y `robots.txt`. Nunca subas `.env` ahí.

Este plan no da acceso por consola, así que la decisión entre A y B se toma mirando el panel de Ferozo antes de subir archivos. Si no encontrás la opción de document root, usá la opción B.

## 3. Configurar `.env` en producción

Creá `/home/USUARIO/canchas/.env` (nunca dentro de `public_html`):

```dotenv
APP_NAME="Complejo Los Álamos"
APP_ENV=production
APP_KEY=base64:...          # ver abajo
APP_DEBUG=false
APP_URL=https://turnos.tucliente.com.ar

APP_LOCALE=es
APP_FAKER_LOCALE=es_AR
APP_TIMEZONE=America/Argentina/Buenos_Aires

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=usuario_canchas
DB_USERNAME=usuario_canchas
DB_PASSWORD=...

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
MAIL_MAILER=smtp
MAIL_HOST=mail.tucliente.com.ar
MAIL_PORT=587
MAIL_USERNAME=turnos@tucliente.com.ar
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=turnos@tucliente.com.ar
MAIL_FROM_NAME="${APP_NAME}"
```

`APP_KEY`: generala localmente y copiá el valor.

```bash
php artisan key:generate --show
```

**No** uses `config:cache` sin verificar: el cache se genera con el `.env` local y puede filtrar valores de desarrollo o romper el sitio. Sin cache la app funciona igual, solo hace unas lecturas más de disco.

## 4. Crear la base y el esquema

### 4.1 Base y usuario

En phpMyAdmin: **Bases de datos → Crear**. Anotá nombre, usuario y contraseña, y usalos en `.env`.

### 4.2 Esquema inicial

El repositorio **no incluye** un `.sql` de esquema: generado a mano se desincroniza con las migraciones. Se produce una vez desde MySQL real, que es la única fuente confiable:

```bash
# con un MySQL/MariaDB local, apuntando a una base vacía
DB_CONNECTION=mysql php artisan migrate
mysqldump --no-data --skip-comments -u root canchas_local > database/sql/schema.sql
```

Después, en phpMyAdmin de DonWeb: **Importar → schema.sql**.

Si preferís no mantener MySQL local, hay dos caminos igual de válidos:

- Pedirle al hosting una ventana con `phpMyAdmin` y ejecutar los `CREATE TABLE` traducidos de cada archivo de `database/migrations`.
- Contratar por un día un MySQL administrado, correr `php artisan migrate` apuntando a DonWeb y exportar.

### 4.3 Migraciones de actualización

Laravel guarda el estado en la tabla `migrations`. Para actualizar producción:

1. Localmente, sobre una copia vacía: `php artisan migrate:fresh` y `mysqldump --no-data`.
2. Compará el `schema.sql` nuevo con el anterior.
3. Escribí el SQL de los cambios (`ALTER TABLE ...`) en `database/sql/2026-xx-xx-cambio.sql`, con el nombre del archivo de migración comentado arriba.
4. Importalo en phpMyAdmin.
5. Insertá a mano la fila en `migrations` para que Laravel sepa que ya corrió:

```sql
INSERT INTO migrations (migration, batch)
VALUES ('2026_01_01_000003_create_courts_tables', (SELECT MAX(batch) + 1 FROM migrations));
```

Nunca crees un endpoint público que ejecute `migrate`, `seed` ni `artisan`. No hay excepciones a esta regla.

### 4.4 Datos iniciales

La primera instalación necesita la fila de configuración. Se puede:

- Importar un `INSERT` preparado a mano en `establishment_settings`, o
- Cargar los datos desde el panel una vez que exista un usuario administrador.

Para crear el administrador sin consola:

```sql
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
VALUES ('Administrador', 'admin@tucliente.com.ar', '$2y$12$HASH', 'admin', 1, NOW(), NOW());
```

Generá el hash en tu máquina:

```bash
php -r "echo password_hash('ClaveSegura2026', PASSWORD_BCRYPT), PHP_EOL;"
```

Cambiá la contraseña desde **Mi cuenta** en el primer ingreso.

## 5. Permisos y HTTPS

- `storage/` y `bootstrap/cache/`: escritura para el usuario del servidor. Por FTP, en Ferozo se ajusta desde el administrador de archivos (755/775 según el caso).
- Activá el certificado SSL del dominio y forzá HTTPS. En `.env`: `APP_URL=https://...`.
- Bloqueá el acceso web al `.env` a nivel hosting (el archivo no debe estar en `public_html`). Si el hosting no permite cambiar el document root, agregá en `public_html/.htaccess`:

```apache
<FilesMatch "^\.env">
    Require all denied
</FilesMatch>
```

- `APP_DEBUG=false`. Con debug activo, cualquier error muestra el `.env` y la ruta absoluta.

## 6. Verificación después de publicar

1. `https://dominio/` carga el sitio y muestra canchas con turnos.
2. `/reservar` lista horarios y crea una reserva con un usuario de prueba.
3. `/panel` entra con el administrador y muestra el resumen del día.
4. Una reserva cancelada libera el horario en el sitio.
5. Un segundo intento de reservar el mismo turno desde otro navegador se rechaza con mensaje.
6. `https://dominio/.env` responde 403 o 404.
7. El correo de recuperación de contraseña llega (depende del SMTP).

## 7. Actualizar una instalación existente

1. Bajá un backup de la base desde phpMyAdmin (**Exportar**).
2. Prepará el paquete nuevo localmente (paso 1).
3. Subí por FTP **sin borrar** `.env` ni `storage/`.
4. Aplicá el SQL de migraciones pendientes (paso 4.3).
5. Borrá `bootstrap/cache/*.php` si subiste algún cacheado.
6. Repetí la verificación del paso 6.

## 8. Limitaciones conocidas de este plan

- Sin SSH no hay `artisan` remoto: todo lo que Laravel ejecuta por consola se resuelve por SQL o se prepara localmente.
- Sin workers: la cola va en `sync`. Los correos se envían en la misma request; si el SMTP demora, la reserva tarda.
- El límite de conexiones simultáneas de MySQL en hosting compartido es bajo. El motor de reservas bloquea por cancha durante milisegundos, no durante la request.
- Los backups son responsabilidad del cliente: este plan no los incluye.
