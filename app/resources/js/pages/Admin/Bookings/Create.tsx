import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { AdminLayout } from '@/layouts/admin-layout';
import { money, shortDate, time } from '@/lib/format';
import type { Slot } from '@/types';

type Props = {
    courts: Array<{ id: number; name: string; sport: string; slot_minutes: number }>;
    selected_court: number | null;
    date: string;
    slots: Slot[];
    customers: Array<{ id: number; name: string; phone: string | null; email: string }>;
    prefill_time: string;
};

export default function Create({ courts, selected_court, date, slots, customers, prefill_time }: Props) {
    const court = courts.find((item) => item.id === selected_court) ?? null;
    const [customerQuery, setCustomerQuery] = useState('');

    const available = slots.filter((slot) => slot.available);
    const defaultSlot = available.find((slot) => slot.start.slice(11, 16) === prefill_time) ?? available[0] ?? null;

    const form = useForm({
        court_id: selected_court ?? 0,
        user_id: customers[0]?.id ?? 0,
        date,
        time: defaultSlot ? defaultSlot.start.slice(11, 16) : '',
        duration_minutes: court?.slot_minutes ?? 60,
        notes: '',
    });

    function reload(next: { court?: number; date?: string; customer_q?: string }) {
        router.get(
            '/panel/reservas/nueva',
            {
                court: next.court ?? selected_court ?? undefined,
                date: next.date ?? date,
                customer_q: (next.customer_q ?? customerQuery) || undefined,
            },
            { preserveScroll: true },
        );
    }

    const selectedSlot = available.find((slot) => slot.start.slice(11, 16) === form.data.time);
    const units = court ? Math.max(1, Math.round(form.data.duration_minutes / court.slot_minutes)) : 1;

    return (
        <AdminLayout
            title="Nueva reserva"
            actions={
                <Link href="/panel/reservas" className="text-sm text-ink-soft underline decoration-line">
                    Volver a la lista
                </Link>
            }
        >
            <Head title="Nueva reserva" />

            <form
                className="grid max-w-3xl gap-4 rounded-card border border-line bg-white p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/panel/reservas');
                }}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Cancha" htmlFor="court_id" error={form.errors.court_id}>
                        <Select
                            id="court_id"
                            value={form.data.court_id}
                            onChange={(event) => reload({ court: Number(event.target.value) })}
                        >
                            {courts.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} · {item.sport}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Fecha" htmlFor="date" error={form.errors.date}>
                        <Input
                            id="date"
                            type="date"
                            value={form.data.date}
                            onChange={(event) => reload({ date: event.target.value })}
                        />
                    </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                        label="Horario"
                        htmlFor="time"
                        error={form.errors.time}
                        hint={available.length === 0 ? 'No quedan turnos libres ese día.' : undefined}
                    >
                        <Select
                            id="time"
                            value={form.data.time}
                            onChange={(event) => form.setData('time', event.target.value)}
                        >
                            {available.length === 0 ? <option value="">Sin turnos</option> : null}
                            {available.map((slot) => (
                                <option key={slot.start} value={slot.start.slice(11, 16)}>
                                    {time(slot.start)} a {time(slot.end)} · {money(slot.price_cents)}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Duración" htmlFor="duration_minutes" error={form.errors.duration_minutes}>
                        <Select
                            id="duration_minutes"
                            value={form.data.duration_minutes}
                            onChange={(event) => form.setData('duration_minutes', Number(event.target.value))}
                        >
                            {court
                                ? [1, 2, 3].map((unit) => (
                                      <option key={unit} value={court.slot_minutes * unit}>
                                          {court.slot_minutes * unit} min
                                      </option>
                                  ))
                                : null}
                        </Select>
                    </Field>
                </div>

                <div className="rounded-control bg-paper-sunk px-3 py-2 text-sm text-ink-soft">
                    {selectedSlot
                        ? `${court?.name} · ${shortDate(date)} de ${form.data.time} a ${addMinutes(
                              form.data.time,
                              form.data.duration_minutes,
                          )} · ${units} turno${units > 1 ? 's' : ''}`
                        : 'Elegí cancha, fecha y horario.'}
                </div>

                <div className="border-t border-line pt-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:items-end">
                        <Field label="Buscar cliente" htmlFor="customer_q">
                            <Input
                                id="customer_q"
                                value={customerQuery}
                                placeholder="Nombre, teléfono o correo"
                                onChange={(event) => setCustomerQuery(event.target.value)}
                                onBlur={() => reload({ customer_q: customerQuery })}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        reload({ customer_q: customerQuery });
                                    }
                                }}
                            />
                        </Field>
                        <Field label="Cliente" htmlFor="user_id" error={form.errors.user_id}>
                            <Select
                                id="user_id"
                                value={form.data.user_id}
                                onChange={(event) => form.setData('user_id', Number(event.target.value))}
                            >
                                {customers.length === 0 ? <option value={0}>Sin clientes</option> : null}
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} · {customer.phone ?? customer.email}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft">
                        Si el cliente no existe,{' '}
                        <Link href="/panel/clientes" className="underline decoration-line">
                            creá la cuenta desde Clientes
                        </Link>{' '}
                        y volvé a esta pantalla.
                    </p>
                </div>

                <Field label="Observaciones (opcional)" htmlFor="notes" error={form.errors.notes}>
                    <Textarea id="notes" value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} />
                </Field>

                <div className="flex gap-2">
                    <Button type="submit" variant="accent" disabled={form.processing || available.length === 0}>
                        {form.processing ? 'Guardando…' : 'Crear reserva'}
                    </Button>
                    <Link
                        href="/panel/reservas"
                        className="rounded-control border border-line px-4 py-2.5 text-sm text-ink hover:border-ink"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}

function addMinutes(clock: string, minutes: number): string {
    const total = Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5)) + minutes;
    const hour = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const minute = String(total % 60).padStart(2, '0');

    return `${hour}:${minute}`;
}
