import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { PublicLayout } from '@/layouts/public-layout';
import { money, shortDate, time } from '@/lib/format';
import type { SharedProps, Slot } from '@/types';

type Props = {
    courts: Array<{ id: number; name: string; sport: string; surface: string | null; slot_minutes: number }>;
    selected_court: number | null;
    date: string;
    slots: Slot[];
    days: Array<{ date: string; label: string }>;
    max_advance_days: number;
    min_advance_minutes: number;
    cancellation_hours: number;
    auto_confirm: boolean;
};

export default function Create({
    courts,
    selected_court,
    date,
    slots,
    days,
    min_advance_minutes,
    cancellation_hours,
    auto_confirm,
}: Props) {
    const { auth } = usePage<SharedProps>().props;
    const court = courts.find((c) => c.id === selected_court) ?? null;
    const [selected, setSelected] = useState<Slot | null>(null);
    const form = useForm({
        court_id: selected_court ?? 0,
        starts_at: '',
        duration_minutes: court?.slot_minutes ?? 60,
        notes: '',
    });

    function visit(nextCourt: number, nextDate: string) {
        setSelected(null);
        router.get('/reservar', { court: nextCourt, date: nextDate }, { preserveScroll: true });
    }

    function choose(slot: Slot) {
        setSelected(slot);
        form.setData({
            ...form.data,
            court_id: selected_court ?? 0,
            starts_at: slot.start,
            duration_minutes: court?.slot_minutes ?? 60,
        });
    }

    function submit() {
        form.post('/reservar', { preserveScroll: true });
    }

    return (
        <PublicLayout>
            <Head title="Reservar un turno" />

            <div className="mx-auto w-full max-w-5xl px-4 py-10">
                <div className="court-rule w-16" aria-hidden="true" />
                <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Elegí cancha, día y horario</h1>
                <p className="mt-2 max-w-xl text-sm text-ink-soft">
                    Los turnos se reservan hasta con {min_advance_minutes} minutos de anticipación y se pueden cancelar
                    hasta {cancellation_hours} horas antes.
                    {auto_confirm ? ' La reserva queda confirmada al crearla.' : ' El club confirma cada reserva.'}
                </p>

                {court && (
                    <div className="mt-8 overflow-x-auto">
                        <div role="group" aria-label="Elegir cancha" className="flex gap-2">
                            {courts.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => visit(item.id, date)}
                                    aria-pressed={item.id === selected_court}
                                    className={`shrink-0 rounded-control border px-3 py-2 text-sm ${
                                        item.id === selected_court
                                            ? 'border-brand bg-brand text-paper'
                                            : 'border-line bg-white text-ink hover:border-ink'
                                    }`}
                                >
                                    {item.name}
                                    <span className={item.id === selected_court ? 'text-paper/70' : 'text-ink-soft'}>
                                        {' '}
                                        · {item.sport}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 overflow-x-auto pb-1">
                    <div role="group" aria-label="Elegir día" className="flex gap-2">
                        {days.map((day) => (
                            <button
                                key={day.date}
                                type="button"
                                onClick={() => visit(selected_court ?? 0, day.date)}
                                aria-pressed={day.date === date}
                                className={`shrink-0 rounded-control border px-3 py-2 text-[13px] capitalize ${
                                    day.date === date
                                        ? 'border-ink bg-ink text-paper'
                                        : 'border-line bg-white text-ink hover:border-ink'
                                }`}
                            >
                                {shortDate(day.date)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 rounded-card border border-line bg-white p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-display text-lg font-semibold text-ink capitalize">{shortDate(date)}</h2>
                        <p className="tnum text-sm text-ink-soft">
                            {court ? `Turnos de ${court.slot_minutes} min` : 'Elegí una cancha'}
                        </p>
                    </div>

                    {!court ? (
                        <p className="mt-6 text-sm text-ink-soft">No hay canchas disponibles para reservar.</p>
                    ) : slots.length === 0 ? (
                        <div className="mt-6 border-t border-line pt-6">
                            <p className="text-sm text-ink">
                                No quedan turnos para este día en {court.name}.
                            </p>
                            <p className="mt-1 text-sm text-ink-soft">
                                Probá con otro día o con otra cancha.
                            </p>
                        </div>
                    ) : (
                        <ul className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-5 sm:grid-cols-3 lg:grid-cols-4">
                            {slots.map((slot) => {
                                const isSelected = selected?.start === slot.start;

                                return (
                                    <li key={slot.start}>
                                        <button
                                            type="button"
                                            disabled={!slot.available}
                                            onClick={() => choose(slot)}
                                            aria-pressed={isSelected}
                                            title={slot.reason ?? undefined}
                                            className={`tnum w-full rounded-control border px-3 py-2.5 text-left ${
                                                !slot.available
                                                    ? 'border-line bg-paper-sunk text-ink-soft/60'
                                                    : isSelected
                                                      ? 'border-accent bg-accent-soft'
                                                      : 'border-line bg-white text-ink hover:border-ink'
                                            }`}
                                        >
                                            <span className="block text-sm font-medium">{time(slot.start)}</span>
                                            <span className="block text-[11px] text-ink-soft">
                                                {slot.available ? money(slot.price_cents) : (slot.reason ?? 'No disponible')}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {selected && (
                    <div className="mt-6 rounded-card border border-accent/40 bg-white p-5">
                        <h2 className="font-display text-lg font-semibold text-ink">Confirmá tu reserva</h2>
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="text-ink-soft">Cancha</dt>
                                <dd className="text-ink">{court?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-ink-soft">Día y hora</dt>
                                <dd className="tnum text-ink capitalize">
                                    {shortDate(selected.start)} · {time(selected.start)} a {time(selected.end)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-ink-soft">Precio</dt>
                                <dd className="tnum font-display text-base font-semibold text-ink">
                                    {money(selected.price_cents)}
                                </dd>
                            </div>
                        </dl>

                        {form.errors.starts_at ? (
                            <p className="mt-3 text-sm font-medium text-accent">{form.errors.starts_at}</p>
                        ) : null}

                        {auth.user ? (
                            <form
                                className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    submit();
                                }}
                            >
                                <Field label="Observaciones (opcional)" htmlFor="notes">
                                    <Textarea
                                        id="notes"
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                        placeholder="Con quién jugás, si necesitás algo del club"
                                    />
                                </Field>
                                <Button variant="accent" type="submit" disabled={form.processing}>
                                    {form.processing ? 'Reservando…' : 'Confirmar reserva'}
                                </Button>
                            </form>
                        ) : (
                            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                                <p className="text-sm text-ink-soft">Necesitás una cuenta para confirmar el turno.</p>
                                <Link
                                    href="/ingresar"
                                    className="rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-paper hover:bg-[#8f3c19]"
                                >
                                    Ingresar y reservar
                                </Link>
                                <Link href="/registro" className="text-sm text-ink underline decoration-line">
                                    Crear cuenta
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
