import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { AdminLayout, Paginator } from '@/layouts/admin-layout';

type Props = {
    customers: {
        data: Array<{
            id: number;
            name: string;
            email: string;
            phone: string | null;
            is_active: boolean;
            bookings_count: number;
        }>;
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: { q: string };
};

export default function Index({ customers, filters }: Props) {
    const [query, setQuery] = useState(filters.q);
    const [creating, setCreating] = useState(false);
    const form = useForm({ name: '', email: '', phone: '', password: '' });

    return (
        <AdminLayout
            title="Clientes"
            actions={
                <Button variant="accent" size="sm" onClick={() => setCreating((open) => !open)}>
                    {creating ? 'Cerrar' : 'Nuevo cliente'}
                </Button>
            }
        >
            <Head title="Clientes" />

            {creating ? (
                <form
                    className="mb-4 grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/panel/clientes', {
                            preserveScroll: true,
                            onSuccess: () => {
                                form.reset();
                                setCreating(false);
                            },
                        });
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
                    <Field
                        label="Contraseña inicial"
                        htmlFor="password"
                        error={form.errors.password}
                        hint="Se la pasás al cliente para que ingrese y la cambie."
                    >
                        <Input
                            id="password"
                            type="text"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                        />
                    </Field>
                    <div className="sm:col-span-2">
                        <Button type="submit" size="sm" disabled={form.processing}>
                            {form.processing ? 'Creando…' : 'Crear cliente'}
                        </Button>
                    </div>
                </form>
            ) : null}

            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    router.get('/panel/clientes', { q: query }, { preserveScroll: true, replace: true });
                }}
            >
                <label htmlFor="q" className="sr-only">
                    Buscar cliente
                </label>
                <Input
                    id="q"
                    value={query}
                    placeholder="Nombre, correo o teléfono"
                    onChange={(event) => setQuery(event.target.value)}
                    className="max-w-sm"
                />
                <Button type="submit" variant="outline">
                    Buscar
                </Button>
            </form>

            <div className="mt-4 overflow-x-auto rounded-card border border-line bg-paper">
                {customers.data.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-ink-soft">No hay clientes con ese criterio.</p>
                ) : (
                    <table className="w-full min-w-[600px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-[11px] font-medium tracking-wide text-ink-soft uppercase">
                                <th scope="col" className="px-3 py-2">
                                    Cliente
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Contacto
                                </th>
                                <th scope="col" className="px-3 py-2 text-right">
                                    Reservas
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    Estado
                                </th>
                                <th scope="col" className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((customer) => (
                                <tr key={customer.id} className="border-b border-line last:border-0">
                                    <td className="px-3 py-2.5 text-ink">{customer.name}</td>
                                    <td className="px-3 py-2.5 text-ink-soft">
                                        {customer.phone ?? 'Sin teléfono'}
                                        <span className="block text-xs">{customer.email}</span>
                                    </td>
                                    <td className="tnum px-3 py-2.5 text-right text-ink-soft">{customer.bookings_count}</td>
                                    <td className="px-3 py-2.5">
                                        <span
                                            className={`inline-flex rounded-control border px-2 py-0.5 text-[11px] font-medium ${
                                                customer.is_active
                                                    ? 'border-brand/25 bg-brand-soft text-brand'
                                                    : 'border-line bg-paper-sunk text-ink-soft'
                                            }`}
                                        >
                                            {customer.is_active ? 'Activo' : 'Desactivado'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <Link
                                            href={`/panel/clientes/${customer.id}`}
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

            <Paginator meta={customers} />
        </AdminLayout>
    );
}
