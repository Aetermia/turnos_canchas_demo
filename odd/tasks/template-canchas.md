# Template de turnos para canchas deportivas

Stack: Laravel 13.42 (PHP 8.4) + Inertia 3 + React 19 + TypeScript + Vite + Tailwind 4, MySQL/InnoDB.
Alcance: una instalación = un establecimiento. No multi-tenant. No API REST separada.
Deploy: DonWeb Web Hosting Emprendedor (FTP + phpMyAdmin, sin SSH, sin Node en producción).

## Specs

- **S1** Autenticación de clientes completa (registro, login, logout, recuperación de contraseña, perfil editable) y aislamiento estricto: `El cliente` no puede leer ni modificar reservas de otro. Criterio: un cliente autenticado recibe 404/403 al pedir una reserva ajena, y las consultas por listado filtran por `user_id`.
- **S2** Tres roles fijos (`admin`, `receptionist`, `customer`) autorizados en Laravel con Policies/Gates. Verbatim del pedido: "No confiar en las restricciones visuales del frontend como mecanismo de seguridad."
- **S3** `Court` es genérica: nombre, deporte libre, tipo, descripción, foto opcional, estado activo, horarios propios, duración de turno, intervalo entre turnos y tarifas propias. Criterio: dos canchas con horarios y precios distintos generan grillas distintas.
- **S4** Disponibilidad derivada del backend: horarios de la cancha, día de la semana, reservas existentes, duración, intervalo, bloqueos, estado de la cancha y anticipación permitida. Verbatim: "No generar horarios que se superpongan con reservas existentes o períodos bloqueados."
- **S5** Reservas solapadas y simultáneas imposibles. Verbatim: "La integridad de las reservas debe mantenerse incluso cuando dos usuarios intenten confirmar el mismo horario al mismo tiempo." Implementación: transacción + `SELECT ... FOR UPDATE` sobre la fila de la cancha + verificación de solapamiento + índice único `(court_id, starts_at)` como red de seguridad. Criterio: dos inserciones concurrentes del mismo horario dejan una sola reserva viva y la otra recibe error manejable.
- **S6** Precio calculado en el servidor y persistido en la reserva; moneda ARS. Verbatim: "El precio deberá calcularse en el backend y conservarse como valor histórico dentro de cada reserva." Criterio: cambiar la tarifa después no altera reservas existentes.
- **S7** Estados `pending`, `confirmed`, `cancelled`, `completed`, `no_show`, con confirmación automática o aprobación administrativa según configuración, y decisión explícita sobre si una reserva pendiente ocupa el horario. Verbatim: "Configuración de reservas: ... debe poder configurarse si una reserva se confirma automáticamente o si requiere intervención del administrador."
- **S8** Cancelación por política configurable (horas de anticipación mínimas). El admin/recepcionista puede crear, modificar, cancelar y confirmar; toda modificación revalida disponibilidad. Criterio: cancelar libera el horario para otra reserva inmediatamente.
- **S9** Trazabilidad en `audit_logs` de creación, modificación, cancelación, cambio de estado y bloqueos. Nada histórico se borra.
- **S10** Configuración del establecimiento en una fila única: nombre comercial, logo, color de acento, contacto, ubicación, moneda, políticas de reserva y cancelación, anticipación mínima y máxima, `auto_confirm` y `pending_blocks_slot`.
- **S11** Fechas y horas en es-AR, precios en ARS con formato `$ 1.234`, mobile sin desborde horizontal (verificación explícita).
- **S12** Despliegue viable en DonWeb: build local, dependencias de producción con Composer local, subida por FTP, migraciones aplicadas por SQL preparado en phpMyAdmin, sin endpoints que ejecuten comandos.
  Verbatim: "No ejecutar migraciones automáticamente desde endpoints públicos."

- **S13** Los datos de ejemplo son genéricos: sin nombre de club, marca, dirección ni personas inventadas que puedan confundirse con un cliente real. Verbatim: "Hace lo mas generico ... tiene que ser full generico, sin nombres conocidos ni nada". Criterio: el seeder crea "Complejo Deportivo", canchas numeradas y clientes "Cliente 01..08"; los campos de contacto arrancan vacíos y el sitio lo declara en vez de imprimir una dirección ficticia.

- **S14** La portada es el tablero de turnos, no una landing: grilla de canchas por filas y horas por columnas con el estado real de cada turno (libre con precio, tomado, fuera de horario), y el turno libre entra a la reserva con cancha, día y hora precargados. Sin hero, sin tarjetas de métrica. Verbatim: "vamos con la A, de ultima volvemos".
- **S15** La identidad visual deja de ser la combinación editorial cálida (papel crema, verde bosque, terracota) y pasa a señalética deportiva: un solo tipo Archivo con cifras tabulares, neutro frío, azul cancha como color de estructura y amarillo señal como único acento. Toda decisión con su razón escrita en `DESIGN.md`. Verbatim: "la estetica visual es muy ai generica".
- **S16** El texto sobre el acento no puede quedar fijo: si el acento configurado es claro, el texto encima pasa a tinta. Ningún par de texto baja de 4.5:1 con cualquier acento válido.

Decisiones abiertas (no se inventan): señas/pagos fuera de esta versión; confirmación automática configurable. Ver `DECISIONES_ABIERTAS.txt`.

## Tasks

| ID | Tarea | Specs | Evidencia |
|---|---|---|---|
| T1 | Base Laravel 13 + Inertia + React + TS + Tailwind, compila | S12 | `453c558`, `vite build` OK |
| T2 | Esquema: settings, courts, schedules, pricing_rules, blocked_periods, bookings, audit_logs; modelos y relaciones | S3, S6, S9, S10 | `179bd90` |
| T3 | Motor de disponibilidad y cálculo de precio | S4, S6 | `179bd90`, AvailabilityTest |
| T4 | Creación de reserva transaccional con bloqueo y anti-solapamiento | S5, S7 | `179bd90`, BookingTest |
| T5 | Cancelación por política + transiciones de estado + auditoría | S8, S9 | `179bd90` |
| T6 | Autenticación y roles (policies) | S1, S2 | `f186d4d`, AuthTest, PermissionsTest |
| T7 | Dashboard admin: calendario, reservas, canchas, clientes, configuración | S3, S7, S10 | `cbf1894`, `56616c8`, PartialClickThrough |
| T8 | Sitio público y flujo de reserva del cliente | S4, S11 | `91e5e60`, click-through OK |
| T9 | Seeders con datos realistas de demo | S3, S10 | `aa02d34` |
| T10 | Guía de despliegue DonWeb (FTP/phpMyAdmin) | S12 | `DEPLOY-DONWEB.md` |
| T11 | Dirección visual A: `DESIGN.md`, tokens, tipografía | S15, S16 | `c2fff06` |
| T12 | Datos del tablero en `PublicController` + test | S14 | `780147e` |
| T13 | Portada como tablero (desktop grilla, móvil lista) + precarga de turno | S14 | `780147e` |
| T14 | Contraste del acento, limpieza de em dash, verificación | S16 | `c2fff06` |


## Log

- **L1** Pedido original: template web reutilizable de gestión de turnos para canchas deportivas, Laravel + Inertia + React + TS + MySQL, deploy económico en DonWeb sin SSH. Requisitos completos en el mensaje inicial del usuario; resumen normativo en Specs. Regla dura citada: "No desarrollar toda la aplicación en una única operación" y "la prioridad absoluta es el motor de reservas".
- **L2** Decisiones abiertas anotadas a pedido explícito en `DECISIONES_ABIERTAS.txt` (señas/pagos y confirmación configurable) antes de escribir código.
- **L3** Verificado localmente: PHP 8.4.25 con las extensiones que Laravel exige, pero **sin `intl`**. Consecuencia: no usar `NumberFormatter` para ARS; formatear con `number_format` y Carbon en `es`. DonWeb debe confirmar `pdo_mysql` e `intl` en el panel.
- **L4** Composer no estaba instalado en el sistema; se instaló `composer.phar` local dentro del proyecto (no se asume `composer` global en el server).
- **L5** `laravel/laravel` resolvió Laravel 13.42 con `php: ^8.3`, alineado con PHP 8.4 objetivo. Si Ferozo no ofrece 8.3+, hay que bajar a Laravel 12 (PHP 8.2+) o 11.

- **L6** Retomado con `antislop` en modo DURING (elección explícita del usuario). La dirección visual del template se define antes del primer componente de UI.
- **L7** Bug encontrado y corregido: `vite.config.js` del scaffold tapaba `vite.config.ts`, por lo que Vite compilaba la fuente por defecto. Se eliminó el `.js`.
- **L8** `intl` no está disponible localmente, así que `Money::format()` arma el formato ARS a mano. No se usa `NumberFormat`.
- **L9** SQLite local (no hay MySQL en la máquina). Las reglas de negocio se testean acá; la garantía de concurrencia (`FOR UPDATE`, InnoDB) solo se puede verificar en MySQL y así queda documentado, sin venderlo como testeado.
- **L10** Suite al cierre de T6: 49 tests, 116 aserciones, todo verde.

- **L11** Click-through verificado en navegador (1440 y 390 px): login de cliente, selección de cancha y día, turno 17:00 con precio, confirmación, y `mis-reservas` mostrando `BK-R9QYLB` confirmada. Consola sin errores. `document.scrollWidth` 375 con viewport 390: sin desborde horizontal.
- **L12** Bug corregido en verificación: `shortDate()` parseaba `YYYY-MM-DD` como medianoche UTC y mostraba el día anterior en Buenos Aires. Ahora los valores sin hora se formatean en UTC y los timestamps completos en `America/Argentina/Buenos_Aires`.
- **L13** Decisión de plantilla: la piel vive en tokens CSS (`--color-paper/ink/brand/accent`, `--font-display/body`) y `accent_color` se inyecta desde `establishment_settings`. Cambiar cliente = cambiar tokens + logo, no reescribir componentes. Ver `DESIGN.md`.

- **L14** Panel implementado: resumen del día con ocupación real, calendario día/semana con eje vertical compartido, listado de reservas con filtros, alta manual, detalle con trazabilidad, canchas con horario semanal y tarifas, clientes, bloqueos y configuración. `CourtPolicy::viewAny` pasa a `false`: la gestión de canchas es sólo admin.
- **L15** Bug de performance encontrado durante la verificación: `Vite::useAggressivePrefetching()` disparaba una ráfaga de requests al montar; con el servidor de PHP (una request por vez) la navegación se colgaba. Se eliminó en `1df61e4`. En hosting compartido el argumento es más fuerte que en local.
- **L16** Verificación del panel: `evaluate` en navegador confirma 14 reservas hoy, `$ 462.000` facturados, 5 columnas de cancha y 15 bloques en el calendario, 20 filas en el listado de reservas y navegación SPA funcionando. El tool de click del navegador expiró en páginas del panel y el snapshot del calendario también: queda declarado como límite de la verificación, no como PASS. La cobertura funcional la dan 11 tests de panel (`AdminTest`).
- **L17** Suite al cierre de T10: 60 tests, 192 aserciones, todo verde; `tsc --noEmit` limpio; `vite build` OK.
- **L18** Corregido por pedido del usuario: el seeder traía un club inventado con nombre propio, ciudad, dirección, teléfonos y personas. Ahora todo es genérico y los contactos quedan en `null`; la sección de ubicación muestra "Falta cargar la dirección..." cuando no hay datos. También se sacaron los nombres propios de los fixtures de tests y de los placeholders de UI.
- **L19** Dirección A elegida por el usuario tras objetar que la estética era genérica de IA. Diagnóstico aceptado: la paleta crema/verde/terracota y la dupla Bricolage + Instrument son la firma visual que la IA repite; el hero (kicker + H1 + 2 CTAs + dos métricas) era el esqueleto R-05 completo. Se reemplaza por un tablero: la información manda y el diseño se subordina.
- **L20** Dirección A implementada y verificada con capturas reales. Cuatro defectos que la captura expuso y el código no: (1) el tablero de 720 px de ancho mínimo desbordaba el documento entero, no sólo su contenedor (medido: `scrollWidth` 717 en un viewport de 390); (2) una grilla de 30 columnas en un teléfono no es usable ni con scroll, así que en móvil la misma data va como lista de horarios por cancha; (3) `capitalize` producía "15 De Noviembre"; (4) el acento seguía siendo el terracota viejo guardado en la base, porque cambié el token y no el dato.
- **L21** Trampa de herramienta, para no repetirla: `msedge --headless --window-size=390` clampa la ventana en ~717 px, así que la captura sale recortada y parece que hay overflow. La medición confiable se hace por CDP con `Emulation.setDeviceMetricsOverride` (viewport 390 exacto) y `Page.captureScreenshot`. Con eso: `/` y `/reservar` dan `scrollWidth` 390 = viewport, sin desborde.
- **L22** Click-through del tablero: el primer turno libre de la portada (`/reservar?court=1&date=2026-11-15&start=21:30`) abre la reserva con cancha, día y turno ya seleccionados (`aria-pressed="true"` en los tres), resumen con "$ 32.000" y el formulario listo.
