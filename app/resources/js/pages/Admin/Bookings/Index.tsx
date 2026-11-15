import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { AdminLayout, Paginator } from '@/layouts/admin-layout';
import { money, shortDate, time } from '@/lib/format';
import type { BookingStatus } from '@/types';

type Row = {
    id: number;
    code: string;
    starts_at: string;
    ends_at: string;
    status: BookingStatus;
    price_cents: number;
    court: string;
    customer: string;
    phone: string | null;
};

type Props = {
    bookings: {
        data: Row[];
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: { q: string; court: number | null; status: string; date: string };
    courts: Array<{ id: number; name: string }>;
    statuses: Array<{ value: string; label: string }>;
};

export default function Index({ bookings, filters, courts, statuses }: Props) {
    const [form, setForm] = useState(filters);

    function apply(next: Partial<typeof form>) {
        const merged = { ...form, ...next };
        setForm(merged);
        router.get('/panel/reservas', merged, { preserveScroll: true, preserveState: true, replace: true });
    }

    return (
        <AdminLayout
            title="Reservas"
            actions={
                <Link
                    href="/panel/reservas/nueva"
                    className="rounded-control bg-accent px-3 py-2 text-sm font-medium on-accent hover:brightness-95"
                >
                    Nueva reserva
                </Link>
            }
        >
            <Head title="Reservas" />

            <form
                className="grid gap-2 rounded-card border border-line bg-paper p-3 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    apply({});
                }}
            >
                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                    Cliente, teléfono o código
                    <input
                        value={form.q}
                        onChange={(event) => setForm({ ...form, q: event.target.value })}
                        placeholder="Nombre, teléfono o BK-123"
                        className="rounded-control border border-line px-2.5 py-1.5 text-sm text-ink"
                    />
                </label>

                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                    Cancha
                    <select
                        value={form.court ?? ''}
                        onChange={(event) =>
                            apply({ court: event.target.value ? Number(event.target.value) : null })
                        }
                        className="rounded-control border border-line px-2.5 py-1.5 text-sm text-ink"
                    >
                        <option value="">Todas</option>
                        {courts.map((court) => (
                            <option key={court.id} value={court.id}>
                                {court.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                    Estado
                    <select
                        value={form.status}
                        onChange={(event) => apply({ status: event.target.value })}
                        className="rounded-control border border-line px-2.5 py-1.5 text-sm text-ink"
                    >
                        <option value="">Todos</option>
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                    Fecha
                    <input
                        type="date"
                        value={form.date}
                        onChange={(event) => apply({ date: event.target.value })}
                        className="rounded-control border border-line px-2.5 py-1.5 text-sm text-ink"
                    />
                </label>

                <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                    <button
                        type="submit"
                        className="rounded-control bg-brand px-3 py-1.5 text-sm font-medium text-paper hover:brightness-110"
                    >
                        Buscar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setForm({ q: '', court: null, status: '', date: '' });
                            router.get('/panel/reservas', {}, { preserveScroll: true });
                        }}
                        className="rounded-control border border-line px-3 py-1.5 text-sm text-ink hover:border-ink"
                    >
                        Limpiar
                    </button>
                </div>
            </form>

            <div className="mt-4 overflow-x-auto rounded-card border border-line bg-paper">
                {bookings.data.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-ink-soft">
                        No hay reservas con esos filtros.
                    </p>
                ) : (
                    <table className="w-full min-w-[680px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-[11px] font-medium tracking-wide text-ink-soft uppercase">
                                <th scope="col" className="px-3 py-2">
                                    Turno
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Cancha
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Cliente
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Estado
                                </th>
                                <th scope="col" className="px-3 py-2 text-right">
                                    Precio
                                </th>
                                <th scope="col" className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.data.map((booking) => (
                                <tr key={booking.id} className="border-b border-line last:border-0">
                                    <td className="tnum px-3 py-2.5 text-ink capitalize">
                                        {shortDate(booking.starts_at)} · {time(booking.starts_at)}
                                    </td>
                                    <td className="px-3 py-2.5 text-ink-soft">{booking.court}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="block text-ink">{booking.customer}</span>
                                        <span className="block text-xs text-ink-soft">
                                            {booking.phone ?? 'sin teléfono'} · {booking.code}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td className="tnum px-3 py-2.5 text-right text-ink">{money(booking.price_cents)}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <Link
                                            href={`/panel/reservas/${booking.id}`}
                                            className="text-xs text-ink underline decoration-line"
                                        >
                                            Abrir
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Paginator meta={bookings} />
        </AdminLayout>
    );
}
