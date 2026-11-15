import { Head, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { AuthLayout } from '@/layouts/auth-layout';

export default function ResetPassword({ email, token }: { email: string; token: string }) {
    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    return (
        <AuthLayout title="Elegí una contraseña nueva" intro="Después de guardar, ya podés ingresar con la clave nueva.">
            <Head title="Restablecer contraseña" />

            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/restablecer-contraseña');
                }}
            >
                <Field label="Correo" htmlFor="email" error={form.errors.email}>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                    />
                </Field>

                <Field label="Contraseña nueva" htmlFor="password" error={form.errors.password} hint="Mínimo 8 caracteres.">
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
                    {form.processing ? 'Guardando…' : 'Guardar contraseña'}
                </Button>
            </form>
        </AuthLayout>
    );
}
