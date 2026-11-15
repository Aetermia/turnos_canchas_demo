import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { AuthLayout } from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status: string | null }) {
    const form = useForm({ email: '' });

    return (
        <AuthLayout
            title="Recuperar la contraseña"
            intro="Poné el correo de tu cuenta y te enviamos un enlace para elegir una nueva."
        >
            <Head title="Recuperar contraseña" />

            {status ? <p className="mb-4 rounded-control border border-brand/30 bg-brand-soft px-3 py-2 text-sm">{status}</p> : null}

            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/recuperar-contraseña');
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

                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Enviando…' : 'Enviar enlace'}
                </Button>
            </form>

            <p className="mt-6 text-sm text-ink-soft">
                <Link href="/ingresar" className="text-ink underline decoration-line">
                    Volver al ingreso
                </Link>
            </p>
        </AuthLayout>
    );
}
