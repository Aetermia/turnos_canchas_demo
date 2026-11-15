import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { AdminLayout } from '@/layouts/admin-layout';
import type { SharedProps } from '@/types';

type Settings = {
    name: string;
    tagline: string | null;
    about: string | null;
    accent_color: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    maps_url: string | null;
    auto_confirm: boolean;
    pending_blocks_slot: boolean;
    min_advance_minutes: number;
    max_advance_days: number;
    cancellation_hours: number;
};

export default function Edit({ settings }: { settings: Settings }) {
    const { brand } = usePage<SharedProps>().props;
    const form = useForm({
        ...settings,
        tagline: settings.tagline ?? '',
        about: settings.about ?? '',
        phone: settings.phone ?? '',
        whatsapp: settings.whatsapp ?? '',
        email: settings.email ?? '',
        address: settings.address ?? '',
        city: settings.city ?? '',
        maps_url: settings.maps_url ?? '',
    });

    // Live preview of the accent while editing: it is the client's whole skin.
    useEffect(() => {
        document.documentElement.style.setProperty('--color-accent', form.data.accent_color);
    }, [form.data.accent_color]);

    return (
        <AdminLayout title="Configuración del establecimiento">
            <Head title="Configuración" />

            <form
                className="grid max-w-3xl gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.patch('/panel/configuracion', { preserveScroll: true });
                }}
            >
                <section className="grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2">
                    <h2 className="font-display text-base font-semibold text-ink sm:col-span-2">Identidad</h2>
                    <Field label="Nombre comercial" htmlFor="name" error={form.errors.name}>
                        <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                    </Field>
                    <Field label="Color de acento" htmlFor="accent_color" error={form.errors.accent_color} hint="Se aplica al sitio y al panel.">
                        <div className="flex items-center gap-2">
                            <input
                                id="accent_color"
                                type="color"
                                value={form.data.accent_color}
                                onChange={(event) => form.setData('accent_color', event.target.value)}
                                className="h-9 w-12 rounded-control border border-line bg-paper"
                            />
                            <Input
                                aria-label="Código hexadecimal del color de acento"
                                value={form.data.accent_color}
                                onChange={(event) => form.setData('accent_color', event.target.value)}
                                className="tnum w-32"
                            />
                        </div>
                    </Field>
                    <Field label="Frase corta" htmlFor="tagline" error={form.errors.tagline} className="sm:col-span-2">
                        <Input
                            id="tagline"
                            value={form.data.tagline}
                            onChange={(event) => form.setData('tagline', event.target.value)}
                        />
                    </Field>
                    <Field label="Presentación" htmlFor="about" error={form.errors.about} className="sm:col-span-2">
                        <Textarea id="about" value={form.data.about} onChange={(event) => form.setData('about', event.target.value)} />
                    </Field>
                </section>

                <section className="grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2">
                    <h2 className="font-display text-base font-semibold text-ink sm:col-span-2">Contacto y ubicación</h2>
                    <Field label="Teléfono" htmlFor="phone" error={form.errors.phone}>
                        <Input id="phone" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} />
                    </Field>
                    <Field label="WhatsApp" htmlFor="whatsapp" error={form.errors.whatsapp} hint="Con código de país, por ejemplo 54911...">
                        <Input
                            id="whatsapp"
                            value={form.data.whatsapp}
                            onChange={(event) => form.setData('whatsapp', event.target.value)}
                        />
                    </Field>
                    <Field label="Correo" htmlFor="email" error={form.errors.email}>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />
                    </Field>
                    <Field label="Ciudad" htmlFor="city" error={form.errors.city}>
                        <Input id="city" value={form.data.city} onChange={(event) => form.setData('city', event.target.value)} />
                    </Field>
                    <Field label="Dirección" htmlFor="address" error={form.errors.address} className="sm:col-span-2">
                        <Input id="address" value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} />
                    </Field>
                    <Field label="Link de Google Maps" htmlFor="maps_url" error={form.errors.maps_url} className="sm:col-span-2">
                        <Input
                            id="maps_url"
                            value={form.data.maps_url}
                            onChange={(event) => form.setData('maps_url', event.target.value)}
                            placeholder="https://maps.google.com/..."
                        />
                    </Field>
                </section>

                <section className="grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2">
                    <h2 className="font-display text-base font-semibold text-ink sm:col-span-2">Política de reservas</h2>

                    <div className="sm:col-span-2">
                        <Checkbox
                            id="auto_confirm"
                            label="Confirmar las reservas automáticamente"
                            checked={form.data.auto_confirm}
                            onChange={(event) => form.setData('auto_confirm', event.target.checked)}
                        />
                        <p className="mt-1 ml-6 text-xs text-ink-soft">
                            Si lo desactivás, cada reserva queda pendiente hasta que la confirmes desde el panel.
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <Checkbox
                            id="pending_blocks_slot"
                            label="Una reserva pendiente ocupa el horario"
                            checked={form.data.pending_blocks_slot}
                            onChange={(event) => form.setData('pending_blocks_slot', event.target.checked)}
                        />
                        <p className="mt-1 ml-6 text-xs text-ink-soft">
                            Evita que dos personas reserven el mismo turno mientras esperan confirmación.
                        </p>
                    </div>

                    <Field label="Anticipación mínima (minutos)" htmlFor="min_advance_minutes" error={form.errors.min_advance_minutes}>
                        <Input
                            id="min_advance_minutes"
                            type="number"
                            value={form.data.min_advance_minutes}
                            onChange={(event) => form.setData('min_advance_minutes', Number(event.target.value))}
                        />
                    </Field>
                    <Field label="Reservas hasta (días)" htmlFor="max_advance_days" error={form.errors.max_advance_days}>
                        <Input
                            id="max_advance_days"
                            type="number"
                            value={form.data.max_advance_days}
                            onChange={(event) => form.setData('max_advance_days', Number(event.target.value))}
                        />
                    </Field>
                    <Field
                        label="Cancelación hasta (horas antes)"
                        htmlFor="cancellation_hours"
                        error={form.errors.cancellation_hours}
                    >
                        <Input
                            id="cancellation_hours"
                            type="number"
                            value={form.data.cancellation_hours}
                            onChange={(event) => form.setData('cancellation_hours', Number(event.target.value))}
                        />
                    </Field>
                </section>

                <div>
                    <Button type="submit" variant="accent" disabled={form.processing}>
                        {form.processing ? 'Guardando…' : 'Guardar configuración'}
                    </Button>
                </div>
            </form>

            <p className="mt-4 max-w-3xl text-xs text-ink-soft">
                Establecimiento actual: {brand.name}. Las señas y los pagos online no están implementados en esta versión.
            </p>
        </AdminLayout>
    );
}
