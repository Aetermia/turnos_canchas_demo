import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { AdminLayout } from '@/layouts/admin-layout';

type Schedule = { weekday: number; is_open: boolean; opens_at: string; closes_at: string };
type Pricing = { weekday: number | null; starts_at: string; ends_at: string; amount: number };

type Props = {
    court: {
        id: number;
        name: string;
        sport: string;
        surface: string | null;
        description: string | null;
        is_active: boolean;
        slot_minutes: number;
        buffer_minutes: number;
        sort_order: number;
    } | null;
    schedules: Schedule[];
    pricing: Pricing[];
};

const weekdayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Form({ court, schedules, pricing }: Props) {
    const form = useForm({
        name: court?.name ?? '',
        sport: court?.sport ?? '',
        surface: court?.surface ?? '',
        description: court?.description ?? '',
        is_active: court?.is_active ?? true,
        slot_minutes: court?.slot_minutes ?? 60,
        buffer_minutes: court?.buffer_minutes ?? 0,
        sort_order: court?.sort_order ?? 0,
        schedules,
        pricing,
    });

    function submit() {
        if (court) {
            form.patch(`/panel/canchas/${court.id}`);
        } else {
            form.post('/panel/canchas');
        }
    }

    return (
        <AdminLayout
            title={court ? `Editar ${court.name}` : 'Nueva cancha'}
            actions={
                <Link href="/panel/canchas" className="text-sm text-ink-soft underline decoration-line">
                    Volver
                </Link>
            }
        >
            <Head title={court ? 'Editar cancha' : 'Nueva cancha'} />

            <form
                className="grid max-w-3xl gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <section className="grid gap-3 rounded-card border border-line bg-white p-4 sm:grid-cols-2">
                    <Field label="Nombre" htmlFor="name" error={form.errors.name}>
                        <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                    </Field>
                    <Field label="Deporte" htmlFor="sport" error={form.errors.sport} hint="Texto libre: Pádel, Fútbol 5, Tenis.">
                        <Input id="sport" value={form.data.sport} onChange={(event) => form.setData('sport', event.target.value)} />
                    </Field>
                    <Field label="Tipo de cancha (opcional)" htmlFor="surface" error={form.errors.surface}>
                        <Input
                            id="surface"
                            value={form.data.surface}
                            onChange={(event) => form.setData('surface', event.target.value)}
                        />
                    </Field>
                    <Field label="Orden en el sitio" htmlFor="sort_order" error={form.errors.sort_order}>
                        <Input
                            id="sort_order"
                            type="number"
                            value={form.data.sort_order}
                            onChange={(event) => form.setData('sort_order', Number(event.target.value))}
                        />
                    </Field>
                    <Field label="Duración del turno" htmlFor="slot_minutes" error={form.errors.slot_minutes}>
                        <Select
                            id="slot_minutes"
                            value={form.data.slot_minutes}
                            onChange={(event) => form.setData('slot_minutes', Number(event.target.value))}
                        >
                            {[30, 45, 60, 75, 90, 120, 180].map((minutes) => (
                                <option key={minutes} value={minutes}>
                                    {minutes} minutos
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field
                        label="Intervalo entre turnos"
                        htmlFor="buffer_minutes"
                        error={form.errors.buffer_minutes}
                        hint="Minutos que quedan libres al terminar cada turno."
                    >
                        <Input
                            id="buffer_minutes"
                            type="number"
                            value={form.data.buffer_minutes}
                            onChange={(event) => form.setData('buffer_minutes', Number(event.target.value))}
                        />
                    </Field>
                    <Field label="Descripción (opcional)" htmlFor="description" error={form.errors.description} className="sm:col-span-2">
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                        />
                    </Field>
                    <div className="sm:col-span-2">
                        <Checkbox
                            id="is_active"
                            label="Cancha activa (publicada en el sitio)"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                        />
                    </div>
                </section>

                <section className="rounded-card border border-line bg-white p-4">
                    <h2 className="font-display text-base font-semibold text-ink">Horario semanal</h2>
                    <p className="mt-1 text-xs text-ink-soft">
                        Si el día está cerrado, la cancha no genera turnos ese día.
                    </p>
                    {form.errors.schedules ? (
                        <p className="mt-2 text-xs font-medium text-accent">{form.errors.schedules}</p>
                    ) : null}

                    <ul className="mt-3 space-y-2">
                        {form.data.schedules.map((schedule, index) => (
                            <li key={schedule.weekday} className="grid grid-cols-[88px_1fr_1fr_auto] items-center gap-2 text-sm">
                                <span className="text-ink">{weekdayNames[schedule.weekday]}</span>
                                <input
                                    type="time"
                                    aria-label={`Apertura ${weekdayNames[schedule.weekday]}`}
                                    value={schedule.opens_at}
                                    disabled={!schedule.is_open}
                                    onChange={(event) => {
                                        const next = [...form.data.schedules];
                                        next[index] = { ...schedule, opens_at: event.target.value };
                                        form.setData('schedules', next);
                                    }}
                                    className="rounded-control border border-line px-2 py-1 text-sm disabled:bg-paper-sunk disabled:text-ink-soft/60"
                                />
                                <input
                                    type="time"
                                    aria-label={`Cierre ${weekdayNames[schedule.weekday]}`}
                                    value={schedule.closes_at}
                                    disabled={!schedule.is_open}
                                    onChange={(event) => {
                                        const next = [...form.data.schedules];
                                        next[index] = { ...schedule, closes_at: event.target.value };
                                        form.setData('schedules', next);
                                    }}
                                    className="rounded-control border border-line px-2 py-1 text-sm disabled:bg-paper-sunk disabled:text-ink-soft/60"
                                />
                                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                                    <input
                                        type="checkbox"
                                        checked={!schedule.is_open}
                                        onChange={(event) => {
                                            const next = [...form.data.schedules];
                                            next[index] = { ...schedule, is_open: !event.target.checked };
                                            form.setData('schedules', next);
                                        }}
                                        className="size-4 accent-[color:var(--color-brand)]"
                                    />
                                    Cerrado
                                </label>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-card border border-line bg-white p-4">
                    <h2 className="font-display text-base font-semibold text-ink">Tarifas</h2>
                    <p className="mt-1 text-xs text-ink-soft">
                        Cada tarifa vale por un turno dentro de la franja. Si hay una tarifa del día y otra general, gana
                        la del día.
                    </p>
                    {form.errors.pricing ? (
                        <p className="mt-2 text-xs font-medium text-accent">{form.errors.pricing}</p>
                    ) : null}

                    <ul className="mt-3 space-y-2">
                        {form.data.pricing.map((rule, index) => (
                            <li key={index} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                                    Día
                                    <select
                                        value={rule.weekday ?? ''}
                                        onChange={(event) => {
                                            const next = [...form.data.pricing];
                                            next[index] = {
                                                ...rule,
                                                weekday: event.target.value ? Number(event.target.value) : null,
                                            };
                                            form.setData('pricing', next);
                                        }}
                                        className="rounded-control border border-line px-2 py-1 text-sm text-ink"
                                    >
                                        <option value="">Todos</option>
                                        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
                                            <option key={weekday} value={weekday}>
                                                {weekdayNames[weekday]}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                                    Desde
                                    <input
                                        type="time"
                                        value={rule.starts_at}
                                        onChange={(event) => {
                                            const next = [...form.data.pricing];
                                            next[index] = { ...rule, starts_at: event.target.value };
                                            form.setData('pricing', next);
                                        }}
                                        className="rounded-control border border-line px-2 py-1 text-sm text-ink"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                                    Hasta
                                    <input
                                        type="time"
                                        value={rule.ends_at}
                                        onChange={(event) => {
                                            const next = [...form.data.pricing];
                                            next[index] = { ...rule, ends_at: event.target.value };
                                            form.setData('pricing', next);
                                        }}
                                        className="rounded-control border border-line px-2 py-1 text-sm text-ink"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                                    Precio ($)
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        value={rule.amount}
                                        onChange={(event) => {
                                            const next = [...form.data.pricing];
                                            next[index] = { ...rule, amount: Number(event.target.value) };
                                            form.setData('pricing', next);
                                        }}
                                        className="tnum w-28 rounded-control border border-line px-2 py-1 text-sm text-ink"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => form.setData('pricing', form.data.pricing.filter((_, i) => i !== index))}
                                    className="rounded-control border border-line px-2 py-1.5 text-xs text-ink-soft hover:border-accent hover:text-accent"
                                >
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={() =>
                            form.setData('pricing', [
                                ...form.data.pricing,
                                { weekday: null, starts_at: '08:00', ends_at: '18:00', amount: 20000 },
                            ])
                        }
                        className="mt-3 rounded-control border border-line px-3 py-1.5 text-sm text-ink hover:border-ink"
                    >
                        Agregar tarifa
                    </button>
                </section>

                <div className="flex gap-2">
                    <Button type="submit" variant="accent" disabled={form.processing}>
                        {form.processing ? 'Guardando…' : court ? 'Guardar cambios' : 'Crear cancha'}
                    </Button>
                    <Link
                        href="/panel/canchas"
                        className="rounded-control border border-line px-4 py-2.5 text-sm text-ink hover:border-ink"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
