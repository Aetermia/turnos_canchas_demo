import { Head, Link } from '@inertiajs/react';

import { StatusBadge } from '@/components/status-badge';
import { ButtonLink } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/admin-layout';
import { money, time } from '@/lib/format';
import type { BookingStatus } from '@/types';

type Props = {
    today: string;
    stats: {
        bookings_today: number;
        revenue_today_cents: number;
        pending: number;
        courts_active: number;
        courts_total: number;
        customers: number;
        occupancy: number;
    };
    occupancy_by_court: Array<{ name: string; booked: number; total: number }>;
    today_bookings: Array<{
        id: number;
        code: string;
        starts_at: string;
        ends_at: string;
        court: string;
        customer: string;
        phone: string | null;
        status: BookingStatus;
        price_cents: number;
    }>;
    next_bookings: Array<{ id: number; starts_at: string; court: string; customer: string; status: BookingStatus }>;
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="border-t-2 border-ink/80 pt-3">
            <p className="text-xs text-ink-soft">{label}</p>
            <p className="tnum mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
            {note ? <p className="mt-1 text-xs text-ink-soft">{note}</p> : null}
        </div>
    );
}

export default function Dashboard({ stats, occupancy_by_court, today_bookings, next_bookings }: Props) {
    return (
        <AdminLayout
            title="Resumen de hoy"
            actions={
                <div className="flex gap-2">
                    <ButtonLink href="/panel/reservas/nueva" variant="accent" size="sm">
                        Nueva reserva
                    </ButtonLink>
                    <ButtonLink href="/panel/calendario" variant="outline" size="sm">
                        Ver calendario
                    </ButtonLink>
                </div>
            }
        >
            <Head title="Panel" />

            <section aria-label="Indicadores de hoy" className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                <Stat label="Reservas de hoy" value={String(stats.bookings_today)} />
                <Stat label="Facturado hoy" value={money(stats.revenue_today_cents)} note="Solo turnos no cancelados" />
                <Stat label="Ocupación" value={`${stats.occupancy}%`} note="Sobre los turnos del día" />
                <Stat
                    label="Pendientes de confirmar"
                    value={String(stats.pending)}
                    note={stats.pending > 0 ? 'Requieren tu revisión' : 'Nada pendiente'}
                />
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <section aria-labelledby="today-title" className="rounded-card border border-line bg-white">
                    <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
                        <h2 id="today-title" className="font-display text-base font-semibold text-ink">
                            Turnos de hoy
                        </h2>
                        <Link href="/panel/reservas" className="text-xs text-ink-soft underline decoration-line">
                            Ver todos
                        </Link>
                    </div>

                    {today_bookings.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-ink-soft">
                            No hay turnos cargados para hoy. Podés crear uno manualmente desde “Nueva reserva”.
                        </p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {today_bookings.map((booking) => (
                                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                    <div className="flex min-w-0 items-baseline gap-3">
                                        <span className="tnum w-12 shrink-0 font-display text-sm font-semibold text-ink">
                                            {time(booking.starts_at)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-ink">{booking.customer}</p>
                                            <p className="text-xs text-ink-soft">
                                                {booking.court} · {booking.code}
                                                {booking.phone ? ` · ${booking.phone}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="tnum text-sm text-ink-soft">{money(booking.price_cents)}</span>
                                        <StatusBadge status={booking.status} />
                                        <Link
                                            href={`/panel/reservas/${booking.id}`}
                                            className="text-xs text-ink underline decoration-line"
                                        >
                                            Abrir
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="space-y-6">
                    <section aria-labelledby="occupancy-title" className="rounded-card border border-line bg-white p-4">
                        <h2 id="occupancy-title" className="font-display text-base font-semibold text-ink">
                            Ocupación por cancha
                        </h2>
                        {occupancy_by_court.length === 0 ? (
                            <p className="mt-3 text-sm text-ink-soft">Todavía no hay canchas activas.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {occupancy_by_court.map((court) => {
                                    const percent = court.total > 0 ? Math.round((court.booked / court.total) * 100) : 0;

                                    return (
                                        <li key={court.name}>
                                            <div className="flex items-baseline justify-between gap-2 text-sm">
                                                <span className="text-ink">{court.name}</span>
                                                <span className="tnum text-xs text-ink-soft">
                                                    {court.booked}/{court.total} turnos
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 w-full rounded-full bg-paper-sunk" aria-hidden="true">
                                                <div className="h-1.5 rounded-full bg-brand" style={{ width: `${percent}%` }} />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    <section aria-labelledby="next-title" className="rounded-card border border-line bg-white p-4">
                        <h2 id="next-title" className="font-display text-base font-semibold text-ink">
                            Próximos turnos
                        </h2>
                        {next_bookings.length === 0 ? (
                            <p className="mt-3 text-sm text-ink-soft">No hay turnos próximos.</p>
                        ) : (
                            <ul className="mt-3 space-y-2 text-sm">
                                {next_bookings.map((booking) => (
                                    <li key={booking.id} className="flex items-baseline justify-between gap-2">
                                        <span className="tnum text-ink">
                                            {new Intl.DateTimeFormat('es-AR', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false,
                                                timeZone: 'America/Argentina/Buenos_Aires',
                                            }).format(new Date(booking.starts_at))}
                                        </span>
                                        <span className="truncate text-xs text-ink-soft">{booking.customer}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <p className="text-xs text-ink-soft">
                        {stats.customers} clientes registrados · {stats.courts_active} de {stats.courts_total} canchas
                        activas
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
