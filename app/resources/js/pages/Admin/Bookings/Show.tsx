import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { AdminLayout } from '@/layouts/admin-layout';
import { money, shortDate, time } from '@/lib/format';
import type { BookingStatus } from '@/types';

type Props = {
    booking: {
        id: number;
        code: string;
        starts_at: string;
        ends_at: string;
        duration_minutes: number;
        price_cents: number;
        status: BookingStatus;
        notes: string | null;
        cancellation_reason: string | null;
        court: { id: number; name: string; sport: string };
        customer: { id: number; name: string; phone: string | null; email: string };
        created_by: string | null;
    };
    logs: Array<{
        id: number;
        action: string;
        user: string | null;
        meta: Record<string, unknown> | null;
        created_at: string;
    }>;
};

const actionLabels: Record<string, string> = {
    'booking.created': 'Reserva creada',
    'booking.confirmed': 'Reserva confirmada',
    'booking.cancelled': 'Reserva cancelada',
    'booking.rescheduled': 'Reserva reprogramada',
    'booking.status_changed': 'Cambio de estado',
};

export default function Show({ booking, logs }: Props) {
    const [mode, setMode] = useState<'idle' | 'cancel' | 'reschedule'>('idle');
    const cancelForm = useForm({ reason: '' });
    const rescheduleForm = useForm({
        court_id: booking.court.id,
        date: booking.starts_at.slice(0, 10),
        time: booking.starts_at.slice(11, 16),
        duration_minutes: booking.duration_minutes,
    });

    const isActive = booking.status === 'pending' || booking.status === 'confirmed';

    return (
        <AdminLayout
            title={`Reserva ${booking.code}`}
            actions={
                <Link href="/panel/reservas" className="text-sm text-ink-soft underline decoration-line">
                    Volver a la lista
                </Link>
            }
        >
            <Head title={`Reserva ${booking.code}`} />

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-4">
                    <section className="rounded-card border border-line bg-paper p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="tnum font-display text-xl font-semibold text-ink capitalize">
                                    {shortDate(booking.starts_at)} · {time(booking.starts_at)} a {time(booking.ends_at)}
                                </p>
                                <p className="text-sm text-ink-soft">
                                    {booking.court.name} · {booking.court.sport} · {booking.duration_minutes} min
                                </p>
                            </div>
                            <div className="text-right">
                                <StatusBadge status={booking.status} />
                                <p className="tnum mt-1 font-display text-lg font-semibold text-ink">
                                    {money(booking.price_cents)}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-ink-soft">Cliente</dt>
                                <dd>
                                    <Link href={`/panel/clientes/${booking.customer.id}`} className="text-ink underline decoration-line">
                                        {booking.customer.name}
                                    </Link>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-ink-soft">Contacto</dt>
                                <dd className="text-ink">
                                    {booking.customer.phone ?? 'Sin teléfono'} · {booking.customer.email}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-ink-soft">Cargada por</dt>
                                <dd className="text-ink">{booking.created_by ?? 'Reserva online'}</dd>
                            </div>
                            <div>
                                <dt className="text-ink-soft">Observaciones</dt>
                                <dd className="text-ink">{booking.notes ?? 'Sin observaciones'}</dd>
                            </div>
                            {booking.cancellation_reason ? (
                                <div className="sm:col-span-2">
                                    <dt className="text-ink-soft">Motivo de cancelación</dt>
                                    <dd className="text-ink">{booking.cancellation_reason}</dd>
                                </div>
                            ) : null}
                        </dl>

                        {isActive ? (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                                {booking.status === 'pending' ? (
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            router.patch(
                                                `/panel/reservas/${booking.id}/confirmar`,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Confirmar
                                    </Button>
                                ) : null}

                                <Button size="sm" variant="outline" onClick={() => setMode('reschedule')}>
                                    Reprogramar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setMode('cancel')}>
                                    Cancelar reserva
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        router.patch(
                                            `/panel/reservas/${booking.id}/cerrar`,
                                            { status: 'completed' },
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    Marcar finalizada
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        router.patch(
                                            `/panel/reservas/${booking.id}/cerrar`,
                                            { status: 'no_show' },
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    Marcar ausente
                                </Button>
                            </div>
                        ) : null}
                    </section>

                    {mode === 'cancel' ? (
                        <form
                            className="rounded-card border border-accent/40 bg-paper p-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                cancelForm.patch(`/panel/reservas/${booking.id}/cancelar`, {
                                    preserveScroll: true,
                                    onSuccess: () => setMode('idle'),
                                });
                            }}
                        >
                            <Field label="Motivo de la cancelación (opcional)" htmlFor="reason">
                                <Textarea
                                    id="reason"
                                    value={cancelForm.data.reason}
                                    onChange={(event) => cancelForm.setData('reason', event.target.value)}
                                    className="min-h-16"
                                />
                            </Field>
                            <div className="mt-3 flex gap-2">
                                <Button type="submit" variant="accent" size="sm" disabled={cancelForm.processing}>
                                    Confirmar cancelación
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>
                                    Volver
                                </Button>
                            </div>
                        </form>
                    ) : null}

                    {mode === 'reschedule' ? (
                        <form
                            className="rounded-card border border-line bg-paper p-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                rescheduleForm.patch(`/panel/reservas/${booking.id}/reprogramar`, {
                                    preserveScroll: true,
                                    onSuccess: () => setMode('idle'),
                                });
                            }}
                        >
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Field label="Fecha" htmlFor="reschedule-date" error={rescheduleForm.errors.date}>
                                    <Input
                                        id="reschedule-date"
                                        type="date"
                                        value={rescheduleForm.data.date}
                                        onChange={(event) => rescheduleForm.setData('date', event.target.value)}
                                    />
                                </Field>
                                <Field label="Hora" htmlFor="reschedule-time" error={rescheduleForm.errors.time}>
                                    <Input
                                        id="reschedule-time"
                                        type="time"
                                        value={rescheduleForm.data.time}
                                        onChange={(event) => rescheduleForm.setData('time', event.target.value)}
                                    />
                                </Field>
                                <Field label="Duración" htmlFor="reschedule-duration">
                                    <Select
                                        id="reschedule-duration"
                                        value={rescheduleForm.data.duration_minutes}
                                        onChange={(event) =>
                                            rescheduleForm.setData('duration_minutes', Number(event.target.value))
                                        }
                                    >
                                        {[30, 60, 90, 120, 150, 180].map((minutes) => (
                                            <option key={minutes} value={minutes}>
                                                {minutes} min
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                            </div>
                            {rescheduleForm.errors.court_id ? (
                                <p className="mt-2 text-xs font-medium text-accent">{rescheduleForm.errors.court_id}</p>
                            ) : null}
                            <div className="mt-3 flex gap-2">
                                <Button type="submit" size="sm" disabled={rescheduleForm.processing}>
                                    Guardar nuevo horario
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>
                                    Volver
                                </Button>
                            </div>
                        </form>
                    ) : null}
                </div>

                <section className="rounded-card border border-line bg-paper p-4">
                    <h2 className="font-display text-base font-semibold text-ink">Trazabilidad</h2>
                    <ul className="mt-3 space-y-3 text-sm">
                        {logs.map((log) => (
                            <li key={log.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
                                <p className="text-ink">{actionLabels[log.action] ?? log.action}</p>
                                <p className="text-xs text-ink-soft">
                                    {new Intl.DateTimeFormat('es-AR', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                        timeZone: 'America/Argentina/Buenos_Aires',
                                    }).format(new Date(log.created_at))}
                                    {log.user ? ` · ${log.user}` : ''}
                                </p>
                                {log.action === 'booking.cancelled' && log.meta && typeof log.meta.reason === 'string' ? (
                                    <p className="text-xs text-ink-soft">Motivo: {log.meta.reason}</p>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </AdminLayout>
    );
}
