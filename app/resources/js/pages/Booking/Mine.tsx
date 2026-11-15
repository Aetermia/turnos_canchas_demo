import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { PublicLayout } from '@/layouts/public-layout';
import { money, shortDate, time } from '@/lib/format';
import type { BookingRow } from '@/types';

type Props = {
    upcoming: BookingRow[];
    history: BookingRow[];
    cancellation_hours: number;
};

function CancelPanel({ booking }: { booking: BookingRow }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ reason: '' });

    if (!open) {
        return (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                Cancelar
            </Button>
        );
    }

    return (
        <form
            className="mt-3 w-full border-t border-line pt-3"
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/mis-reservas/${booking.id}/cancelar`, { preserveScroll: true });
            }}
        >
            <Field label="Motivo (opcional)" htmlFor={`reason-${booking.id}`}>
                <Textarea
                    id={`reason-${booking.id}`}
                    value={form.data.reason}
                    onChange={(event) => form.setData('reason', event.target.value)}
                    className="min-h-16"
                    placeholder="Por qué cancelás el turno"
                />
            </Field>
            <div className="mt-2 flex gap-2">
                <Button variant="accent" size="sm" type="submit" disabled={form.processing}>
                    Confirmar cancelación
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Volver
                </Button>
            </div>
        </form>
    );
}

export default function Mine({ upcoming, history, cancellation_hours }: Props) {
    return (
        <PublicLayout>
            <Head title="Mis reservas" />

            <div className="mx-auto w-full max-w-3xl px-4 py-10">
                <div className="board-rule w-16" aria-hidden="true" />
                <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Mis reservas</h1>
                <p className="mt-2 text-sm text-ink-soft">
                    Podés cancelar hasta {cancellation_hours} horas antes del turno. El horario se libera al instante.
                </p>

                <section className="mt-8">
                    <h2 className="font-display text-lg font-semibold text-ink">Próximos turnos</h2>

                    {upcoming.length === 0 ? (
                        <div className="mt-4 rounded-card border border-line bg-paper p-5">
                            <p className="text-sm text-ink">No tenés turnos reservados.</p>
                            <p className="mt-1 text-sm text-ink-soft">
                                Cuando reserves, el turno aparece acá con su código.
                            </p>
                            <Link
                                href="/reservar"
                                className="mt-3 inline-block rounded-control bg-accent px-4 py-2.5 text-sm font-medium on-accent hover:brightness-95"
                            >
                                Buscar un turno
                            </Link>
                        </div>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {upcoming.map((booking) => (
                                <li key={booking.id} className="rounded-card border border-line bg-paper p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="tnum font-display text-lg font-semibold text-ink capitalize">
                                                {shortDate(booking.starts_at)} · {time(booking.starts_at)} a{' '}
                                                {time(booking.ends_at)}
                                            </p>
                                            <p className="text-sm text-ink-soft">
                                                {booking.court.name} · {booking.court.sport} · {booking.code}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="tnum text-sm text-ink">{money(booking.price_cents)}</span>
                                            <StatusBadge status={booking.status} />
                                        </div>
                                    </div>

                                    {booking.can_cancel ? (
                                        <CancelPanel booking={booking} />
                                    ) : (
                                        <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
                                            Este turno ya no se puede cancelar online. Escribinos por WhatsApp.
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="mt-10">
                    <h2 className="font-display text-lg font-semibold text-ink">Historial</h2>

                    {history.length === 0 ? (
                        <p className="mt-3 text-sm text-ink-soft">Todavía no hay turnos anteriores.</p>
                    ) : (
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[520px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-ink/20 text-left text-xs font-medium tracking-wide text-ink-soft uppercase">
                                        <th scope="col" className="py-2 pr-4">
                                            Turno
                                        </th>
                                        <th scope="col" className="py-2 pr-4">
                                            Cancha
                                        </th>
                                        <th scope="col" className="py-2 pr-4">
                                            Estado
                                        </th>
                                        <th scope="col" className="py-2 text-right">
                                            Precio
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((booking) => (
                                        <tr key={booking.id} className="border-b border-line">
                                            <td className="tnum py-2.5 pr-4 text-ink capitalize">
                                                {shortDate(booking.starts_at)} · {time(booking.starts_at)}
                                            </td>
                                            <td className="py-2.5 pr-4 text-ink-soft">{booking.court.name}</td>
                                            <td className="py-2.5 pr-4">
                                                <StatusBadge status={booking.status} />
                                            </td>
                                            <td className="tnum py-2.5 text-right text-ink">
                                                {money(booking.price_cents)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </PublicLayout>
    );
}
