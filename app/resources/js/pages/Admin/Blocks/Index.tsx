import { Head, router, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { AdminLayout } from '@/layouts/admin-layout';
import { shortDate, time, todayIso } from '@/lib/format';

type Props = {
    blocks: Array<{
        id: number;
        court: string | null;
        starts_at: string;
        ends_at: string;
        reason: string;
        created_by: string | null;
        is_past: boolean;
    }>;
    courts: Array<{ id: number; name: string }>;
};

export default function Index({ blocks, courts }: Props) {
    const form = useForm({
        court_id: '' as string | number,
        date: todayIso(),
        starts_at: '12:00',
        ends_at: '14:00',
        reason: '',
    });

    return (
        <AdminLayout title="Bloqueos de horario">
            <Head title="Bloqueos" />

            <form
                className="grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/panel/bloqueos', {
                        preserveScroll: true,
                        onSuccess: () => form.reset('reason'),
                    });
                }}
            >
                <Field label="Cancha" htmlFor="court_id" error={form.errors.court_id}>
                    <Select
                        id="court_id"
                        value={form.data.court_id}
                        onChange={(event) => form.setData('court_id', event.target.value)}
                    >
                        <option value="">Todo el establecimiento</option>
                        {courts.map((court) => (
                            <option key={court.id} value={court.id}>
                                {court.name}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Día" htmlFor="date" error={form.errors.date}>
                    <Input id="date" type="date" value={form.data.date} onChange={(event) => form.setData('date', event.target.value)} />
                </Field>
                <Field label="Desde" htmlFor="starts_at" error={form.errors.starts_at}>
                    <Input
                        id="starts_at"
                        type="time"
                        value={form.data.starts_at}
                        onChange={(event) => form.setData('starts_at', event.target.value)}
                    />
                </Field>
                <Field label="Hasta" htmlFor="ends_at" error={form.errors.ends_at}>
                    <Input
                        id="ends_at"
                        type="time"
                        value={form.data.ends_at}
                        onChange={(event) => form.setData('ends_at', event.target.value)}
                    />
                </Field>
                <Field label="Motivo" htmlFor="reason" error={form.errors.reason}>
                    <Input
                        id="reason"
                        value={form.data.reason}
                        placeholder="Mantenimiento, lluvia, feriado"
                        onChange={(event) => form.setData('reason', event.target.value)}
                    />
                </Field>
                <div className="lg:col-span-5">
                    <Button type="submit" variant="accent" size="sm" disabled={form.processing}>
                        {form.processing ? 'Bloqueando…' : 'Bloquear horario'}
                    </Button>
                </div>
            </form>

            <div className="mt-4 overflow-x-auto rounded-card border border-line bg-paper">
                {blocks.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-ink-soft">
                        No hay bloqueos cargados. Un bloqueo saca esos turnos de la disponibilidad pública.
                    </p>
                ) : (
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-[11px] font-medium tracking-wide text-ink-soft uppercase">
                                <th scope="col" className="px-3 py-2">
                                    Cuándo
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Cancha
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Motivo
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Cargado por
                                </th>
                                <th scope="col" className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {blocks.map((block) => (
                                <tr key={block.id} className={`border-b border-line last:border-0 ${block.is_past ? 'text-ink-soft' : ''}`}>
                                    <td className="tnum px-3 py-2.5 capitalize">
                                        {shortDate(block.starts_at)} · {time(block.starts_at)} a {time(block.ends_at)}
                                    </td>
                                    <td className="px-3 py-2.5">{block.court ?? 'Todo el establecimiento'}</td>
                                    <td className="px-3 py-2.5">{block.reason}</td>
                                    <td className="px-3 py-2.5 text-xs">{block.created_by ?? 'Sin dato'}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        {block.is_past ? (
                                            <span className="text-xs text-ink-soft">Pasado</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => router.delete(`/panel/bloqueos/${block.id}`, { preserveScroll: true })}
                                                className="text-xs text-ink underline decoration-line hover:text-accent"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
