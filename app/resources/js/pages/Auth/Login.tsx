import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input } from '@/components/ui/field';
import { AuthLayout } from '@/layouts/auth-layout';

export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });

    return (
        <AuthLayout title="Ingresá a tu cuenta" intro="Con tu cuenta reservás, cancelás y ves tus turnos.">
            <Head title="Ingresar" />

            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/ingresar', { onFinish: () => form.reset('password') });
                }}
            >
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

                <Field label="Contraseña" htmlFor="password" error={form.errors.password}>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={form.data.password}
                        aria-invalid={Boolean(form.errors.password)}
                        aria-describedby={form.errors.password ? 'password-error' : undefined}
                        onChange={(event) => form.setData('password', event.target.value)}
                    />
                </Field>

                <Checkbox
                    id="remember"
                    label="Mantener la sesión abierta"
                    checked={form.data.remember}
                    onChange={(event) => form.setData('remember', event.target.checked)}
                />

                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Ingresando…' : 'Ingresar'}
                </Button>
            </form>

            <div className="mt-6 space-y-2 text-sm text-ink-soft">
                <p>
                    <Link href="/recuperar-contraseña" className="text-ink underline decoration-line">
                        Olvidé mi contraseña
                    </Link>
                </p>
                <p>
                    ¿No tenés cuenta?{' '}
                    <Link href="/registro" className="text-ink underline decoration-line">
                        Crear una cuenta
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
