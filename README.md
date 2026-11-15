# Template de turnos para canchas

Aplicación web para que un club deportivo venda turnos online y los administre desde un panel. Una instalación = un establecimiento. Se reutiliza para cada cliente cambiando datos y tokens, no código.

- Laravel 13.42 (PHP 8.3+) con Inertia 3 y React 19, TypeScript y Tailwind 4.
- MySQL / InnoDB en producción. SQLite en desarrollo local si no hay MySQL.
- Pensado para hosting compartido: sin SSH, sin Node en producción, sin Redis ni workers.

## Puesta en marcha local

```bash
php composer.phar install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run build          # o npm run dev en otra terminal
php artisan serve
```

Si no tenés PHP instalado, en Windows: `winget install PHP.PHP.8.4`. El repositorio trae `composer.phar`, así que no hace falta Composer global.

### Usuarios de la demo (`--seed`)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@demo.test` | `password` |
| Recepcionista | `recepcion@demo.test` | `password` |
| Cliente | `cliente@demo.test` | `password` |

Los datos del seeder son inventados a propósito: un club ficticio con cinco canchas, tarifas y reservas de la semana. No son datos de un cliente real.

## Comandos

```bash
php artisan test          # 60 tests: motor, permisos, panel
npx tsc --noEmit          # tipos del frontend
npx vite build            # assets de producción
vendor/bin/pint           # formato PHP
```

## Cómo se organiza

| Ruta | Qué hay |
|---|---|
| `app/app/Services/AvailabilityService.php` | Disponibilidad y precio. Única fuente de verdad. |
| `app/app/Services/BookingService.php` | Crear, reprogramar, cancelar, confirmar. Transacción + lock por cancha. |
| `app/app/Models` | `Court`, `Booking`, `CourtSchedule`, `PricingRule`, `BlockedPeriod`, `EstablishmentSetting`, `AuditLog`. |
| `app/routes/web.php` | Sitio público y cuenta del cliente. |
| `app/routes/admin.php` | Panel de administración y recepción. |
| `app/resources/js/pages` | Páginas Inertia. `Home`, `Booking/*`, `Auth/*`, `Admin/*`. |
| `app/resources/css/app.css` | Tokens de la piel. |

## Personalizar para un cliente nuevo

1. Copiá el repositorio e instalá.
2. En el panel, **Configuración**: nombre, color de acento, contacto, dirección, políticas.
3. En **Canchas**: canchas reales, horarios y tarifas.
4. Reemplazá el logo en `establishment_settings.logo_path` cuando exista el archivo.
5. Opcional: ajustá los tokens en `resources/css/app.css` (`--color-brand`, `--font-display`, radios).
6. Borrá el seeder de demo o dejalo correr solo en local.

Las decisiones de diseño y su porqué están en `DESIGN.md`. El despliegue paso a paso está en `docs/DEPLOY-DONWEB.md`.
