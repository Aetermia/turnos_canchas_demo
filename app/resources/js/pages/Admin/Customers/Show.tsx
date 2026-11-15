import { Head, Link, useForm } from '@inertiajs/react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input } from '@/components/ui/field';
import { AdminLayout } from '@/layouts/admin-layout';
import { money, shortDate, time } from '@/lib/format';
import type { BookingStatus } from '@/types';

type Props = {
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        is_active: boolean;
        created_at: string;
    };
    stats: { total: number; cancelled: number; no_show: number; spent_cents: number };
    bookings: Array<{
        id: number;
        code: string;
        starts_at: string;
        status: BookingStatus;
        price_cents: number;
        court: string;
    }>;
};

export default function Show({ customer, stats, bookings }: Props) {
    const form = useForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? '',
        is_active: customer.is_active,
    });

    return (
        <AdminLayout
            title={customer.name}
            actions={
                <Link href="/panel/clientes" className="text-sm text-ink-soft underline decoration-line">
                    Volver a clientes
                </Link>
            }
        >
            <Head title={customer.name} />

            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                <div className="space-y-4">
                    <form
                        className="grid gap-3 rounded-card border border-line bg-white p-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.patch(`/panel/clientes/${customer.id}`, { preserveScroll: true });
                        }}
                    >
                        <Field label="Nombre y apellido" htmlFor="name" error={form.errors.name}>
                            <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        </Field>
                        <Field label="Correo" htmlFor="email" error={form.errors.email}>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                            />
                        </Field>
                        <Field label="Teléfono" htmlFor="phone" error={form.errors.phone}>
                            <Input id="phone" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} />
                        </Field>
                        <Checkbox
                            id="is_active"
                            label="Cuenta activa (puede reservar e ingresar)"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                        />
                        <div>
                            <Button type="submit" size="sm" disabled={form.processing}>
                                {form.processing ? 'Guardando…' : 'Guardar cambios'}
                            </Button>
                        </div>
                        <p className="text-xs text-ink-soft">
                            Alta: {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(customer.created_at))}
                        </p>
                    </form>

                    <dl className="grid grid-cols-2 gap-4 rounded-card border border-line bg-white p-4">
                        <div>
                            <dt className="text-xs text-ink-soft">Reservas</dt>
                            <dd className="tnum font-display text-xl font-semibold text-ink">{stats.total}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-ink-soft">Facturado</dt>
                            <dd className="tnum font-display text-xl font-semibold text-ink">{money(stats.spent_cents)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-ink-soft">Canceladas</dt>
                            <dd className="tnum font-display text-xl font-semibold text-ink">{stats.cancelled}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-ink-soft">Ausencias</dt>
                            <dd className="tnum font-display text-xl font-semibold text-ink">{stats.no_show}</dd>
                        </div>
                    </dl>
                </div>

                <section className="rounded-card border border-line bg-white">
                    <h2 className="border-b border-line px-4 py-3 font-display text-base font-semibold text-ink">
                        Historial de reservas
                    </h2>

                    {bookings.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-ink-soft">Este cliente todavía no reservó.</p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {bookings.map((booking) => (
                                <li key={booking.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <div>
                                        <p className="tnum text-ink capitalize">
                                            {shortDate(booking.starts_at)} · {time(booking.starts_at)}
                                        </p>
                                        <p className="text-xs text-ink-soft">
                                            {booking.court} · {booking.code}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={booking.status} />
                                        <Link
                                            href={`/panel/reservas/${booking.id}`}
                                            className="text-xs text-ink underline decoration-line"
                                        >
                                            Ver
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
