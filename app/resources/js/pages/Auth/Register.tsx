import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { AuthLayout } from '@/layouts/auth-layout';

export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <AuthLayout title="Creá tu cuenta" intro="Tardás menos de un minuto y después reservás en dos toques.">
            <Head title="Crear cuenta" />

            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/registro');
                }}
            >
                <Field label="Nombre y apellido" htmlFor="name" error={form.errors.name}>
                    <Input
                        id="name"
                        autoComplete="name"
                        required
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
                        autoComplete="email"
                        required
                        value={form.data.email}
                        aria-invalid={Boolean(form.errors.email)}
                        aria-describedby={form.errors.email ? 'email-error' : undefined}
                        onChange={(event) => form.setData('email', event.target.value)}
                    />
                </Field>

                <Field label="Teléfono (opcional)" htmlFor="phone" error={form.errors.phone} hint="Lo usamos solo si hay un problema con un turno.">
                    <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.data.phone}
                        onChange={(event) => form.setData('phone', event.target.value)}
                    />
                </Field>

                <Field label="Contraseña" htmlFor="password" error={form.errors.password} hint="Mínimo 8 caracteres.">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={form.data.password}
                        aria-invalid={Boolean(form.errors.password)}
                        aria-describedby={form.errors.password ? 'password-error' : undefined}
                        onChange={(event) => form.setData('password', event.target.value)}
                    />
                </Field>

                <Field label="Repetí la contraseña" htmlFor="password_confirmation">
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={form.data.password_confirmation}
                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                    />
                </Field>

                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Creando cuenta…' : 'Crear cuenta'}
                </Button>
            </form>

            <p className="mt-6 text-sm text-ink-soft">
                ¿Ya tenés cuenta?{' '}
                <Link href="/ingresar" className="text-ink underline decoration-line">
                    Ingresar
                </Link>
            </p>
        </AuthLayout>
    );
}
