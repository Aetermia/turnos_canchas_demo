import { Head, Link, useForm, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PublicLayout } from '@/layouts/public-layout';
import type { SharedProps } from '@/types';

export default function Edit({ bookings_count }: { bookings_count: number }) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user!;
    const form = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <PublicLayout>
            <Head title="Mi cuenta" />

            <div className="mx-auto w-full max-w-2xl px-4 py-10">
                <div className="court-rule w-16" aria-hidden="true" />
                <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Mi cuenta</h1>
                <p className="mt-2 text-sm text-ink-soft">
                    {bookings_count === 0
                        ? 'Todavía no reservaste ningún turno.'
                        : `Tenés ${bookings_count} ${bookings_count === 1 ? 'reserva' : 'reservas'} en tu historial.`}{' '}
                    <Link href="/mis-reservas" className="text-ink underline decoration-line">
                        Ver mis reservas
                    </Link>
                </p>

                <form
                    className="mt-8 grid gap-5 rounded-card border border-line bg-white p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch('/mi-cuenta', { preserveScroll: true });
                    }}
                >
                    <Field label="Nombre y apellido" htmlFor="name" error={form.errors.name}>
                        <Input
                            id="name"
                            value={form.data.name}
                            aria-invalid={Boolean(form.errors.name)}
                            aria-describedby={form.errors.name ? 'name-error' : undefined}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                    </Field>

                    <Field label="Correo" htmlFor="email" error={form.errors.email}>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            aria-invalid={Boolean(form.errors.email)}
                            aria-describedby={form.errors.email ? 'email-error' : undefined}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />
                    </Field>

                    <Field label="Teléfono" htmlFor="phone" error={form.errors.phone}>
                        <Input
                            id="phone"
                            type="tel"
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                        />
                    </Field>

                    <fieldset className="grid gap-4 border-t border-line pt-5">
                        <legend className="text-sm font-medium text-ink">Cambiar contraseña</legend>
                        <p className="-mt-2 text-xs text-ink-soft">Dejá estos campos vacíos si no querés cambiarla.</p>

                        <Field label="Contraseña actual" htmlFor="current_password" error={form.errors.current_password}>
                            <Input
                                id="current_password"
                                type="password"
                                autoComplete="current-password"
                                value={form.data.current_password}
                                onChange={(event) => form.setData('current_password', event.target.value)}
                            />
                        </Field>

                        <Field label="Contraseña nueva" htmlFor="password" error={form.errors.password}>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                            />
                        </Field>

                        <Field label="Repetí la contraseña nueva" htmlFor="password_confirmation">
                            <Input
                                id="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                value={form.data.password_confirmation}
                                onChange={(event) => form.setData('password_confirmation', event.target.value)}
                            />
                        </Field>
                    </fieldset>

                    <div>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Guardando…' : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}
