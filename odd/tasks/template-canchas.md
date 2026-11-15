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
| T7 | Dashboard admin: calendario, reservas, canchas, clientes, configuración | S3, S7, S10 | click-through |
| T8 | Sitio público y flujo de reserva del cliente | S4, S11 | click-through |
| T9 | Seeders con datos realistas de demo | S3, S10 | migrate:fresh --seed |
| T10 | Guía de despliegue DonWeb (FTP/phpMyAdmin) | S12 | doc |

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
