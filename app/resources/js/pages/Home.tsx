import { Head } from '@inertiajs/react';

import { CourtDiagram } from '@/components/court-diagram';
import { ButtonLink } from '@/components/ui/button';
import { PublicLayout } from '@/layouts/public-layout';
import { longDate, money, time } from '@/lib/format';

type Rate = {
    weekday: number | null;
    starts_at: string;
    ends_at: string;
    amount_cents: number;
};

type Court = {
    id: number;
    name: string;
    sport: string;
    surface: string | null;
    description: string | null;
    slot_minutes: number;
    price_from_cents: number | null;
    schedule: string;
    next_free: string | null;
    free_today: number;
    rates: Rate[];
};

type Props = {
    today: string;
    contact: {
        phone: string | null;
        whatsapp: string | null;
        email: string | null;
        address: string | null;
        city: string | null;
        maps_url: string | null;
        tagline: string | null;
        about: string | null;
    };
    policies: { cancellation_hours: number; max_advance_days: number; auto_confirm: boolean };
    courts: Court[];
};

const weekdayNames = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function sportsLabel(courts: Court[]): string {
    const sports = [...new Set(courts.map((c) => c.sport))];

    if (sports.length === 0) {
        return 'Canchas';
    }

    if (sports.length === 1) {
        return sports[0];
    }

    return `${sports.slice(0, -1).join(', ')} y ${sports[sports.length - 1]}`;
}

function SectionTitle({ id, title, note }: { id: string; title: string; note?: string }) {
    return (
        <div id={id} className="scroll-mt-24">
            <div className="court-rule w-16" aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
            {note ? <p className="mt-2 max-w-xl text-sm text-ink-soft">{note}</p> : null}
        </div>
    );
}

export default function Home({ today, contact, policies, courts }: Props) {
    const city = contact.city;
    const headline = city ? `${sportsLabel(courts)} en ${city}` : 'Reservá tu turno online';
    const totalFreeToday = courts.reduce((sum, court) => sum + court.free_today, 0);
    const hasContactInfo = Boolean(
        contact.address || contact.phone || contact.whatsapp || contact.email || contact.maps_url,
    );

    return (
        <PublicLayout>
            <Head title="Reservá tu turno" />

            <section className="mx-auto w-full max-w-5xl px-4 pt-12 pb-16 sm:pt-16">
                <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                    <div>
                        <div className="court-rule w-16" aria-hidden="true" />
                        <p className="mt-4 text-sm font-medium text-ink-soft">{contact.tagline ?? 'Turnos online'}</p>
                        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-semibold text-ink sm:text-5xl">
                            {headline}
                        </h1>
                        <p className="mt-5 max-w-lg text-base text-ink-soft">
                            {contact.about ??
                                `Elegí cancha, día y horario, y confirmá en el momento. ${courts.length} canchas disponibles.`}
                        </p>

                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <ButtonLink href="/reservar" variant="accent">
                                Reservar turno
                            </ButtonLink>
                            <a
                                href="#tarifas"
                                className="rounded-control border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-ink hover:bg-paper-sunk"
                            >
                                Ver tarifas
                            </a>
                        </div>

                        <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 text-sm">
                            <div>
                                <dt className="text-ink-soft">Turnos libres hoy</dt>
                                <dd className="tnum font-display text-xl font-semibold text-ink">{totalFreeToday}</dd>
                            </div>
                            <div>
                                <dt className="text-ink-soft">Cancelación</dt>
                                <dd className="font-display text-xl font-semibold text-ink">
                                    {policies.cancellation_hours} h antes
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-card border border-line bg-white p-5">
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 className="font-display text-lg font-semibold text-ink">Hoy</h2>
                            <span className="text-xs text-ink-soft">{longDate(today)}</span>
                        </div>

                        {courts.length === 0 ? (
                            <p className="mt-4 text-sm text-ink-soft">
                                Todavía no hay canchas publicadas. Un administrador tiene que cargarlas desde el panel.
                            </p>
                        ) : (
                            <ul className="mt-4 divide-y divide-line">
                                {courts.map((court) => (
                                    <li key={court.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-ink">{court.name}</p>
                                            <p className="text-xs text-ink-soft">
                                                {court.sport}
                                                {court.surface ? ` · ${court.surface}` : ''}
                                            </p>
                                        </div>
                                        {court.next_free ? (
                                            <a
                                                href={`/reservar?court=${court.id}`}
                                                className="tnum shrink-0 rounded-control border border-brand/25 bg-brand-soft px-2.5 py-1 text-[13px] font-medium text-brand hover:border-brand"
                                            >
                                                {time(court.next_free)}
                                            </a>
                                        ) : (
                                            <span className="shrink-0 text-xs text-ink-soft">Sin turnos</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
                            {policies.auto_confirm
                                ? 'Las reservas se confirman solas al pagar en el club.'
                                : 'Revisamos cada reserva y la confirmamos a la brevedad.'}
                        </p>
                    </div>
                </div>
            </section>

            <section className="border-t border-line bg-white py-14">
                <div className="mx-auto w-full max-w-5xl px-4">
                    <SectionTitle
                        id="canchas"
                        title="Las canchas"
                        note="Cada cancha tiene su horario, su duración de turno y su tarifa. Elegí la que quieras reservar."
                    />

                    {courts.length === 0 ? (
                        <p className="mt-8 text-sm text-ink-soft">No hay canchas cargadas.</p>
                    ) : (
                        <ul className="mt-8">
                            {courts.map((court) => (
                                <li
                                    key={court.id}
                                    className="grid gap-4 border-t border-line py-6 sm:grid-cols-[112px_1fr_auto] sm:items-center"
                                >
                                    <CourtDiagram className="h-16 w-24 text-ink/25" />
                                    <div>
                                        <h3 className="font-display text-lg font-semibold text-ink">{court.name}</h3>
                                        <p className="text-sm text-ink-soft">
                                            {court.sport}
                                            {court.surface ? ` · ${court.surface}` : ''} · turnos de{' '}
                                            {court.slot_minutes} min
                                        </p>
                                        <p className="mt-1 text-sm text-ink-soft">{court.schedule}</p>
                                        {court.description ? (
                                            <p className="mt-2 max-w-xl text-sm text-ink-soft">{court.description}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                                        <p className="tnum text-sm text-ink">
                                            <span className="text-ink-soft">desde </span>
                                            <span className="font-display text-lg font-semibold">
                                                {money(court.price_from_cents)}
                                            </span>
                                        </p>
                                        <ButtonLink href={`/reservar?court=${court.id}`} variant="outline" size="sm">
                                            Ver turnos
                                        </ButtonLink>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className="py-14">
                <div className="mx-auto w-full max-w-5xl px-4">
                    <SectionTitle
                        id="tarifas"
                        title="Tarifas"
                        note="El precio se calcula al confirmar y queda guardado en la reserva, aunque después cambie la tarifa."
                    />

                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-sm">
                            <caption className="sr-only">Tarifas por cancha, día y franja horaria</caption>
                            <thead>
                                <tr className="border-b border-ink/20 text-left text-xs font-medium tracking-wide text-ink-soft uppercase">
                                    <th scope="col" className="py-2 pr-4">
                                        Cancha
                                    </th>
                                    <th scope="col" className="py-2 pr-4">
                                        Día
                                    </th>
                                    <th scope="col" className="py-2 pr-4">
                                        Horario
                                    </th>
                                    <th scope="col" className="py-2 text-right">
                                        Valor del turno
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {courts.flatMap((court) =>
                                    court.rates.map((rate, index) => (
                                        <tr key={`${court.id}-${index}`} className="border-b border-line">
                                            <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                                                {index === 0 ? court.name : <span className="sr-only">{court.name}</span>}
                                            </th>
                                            <td className="py-2.5 pr-4 text-ink-soft">
                                                {rate.weekday === null ? 'Todos los días' : weekdayNames[rate.weekday]}
                                            </td>
                                            <td className="tnum py-2.5 pr-4 text-ink-soft">
                                                {rate.starts_at.slice(0, 5)} a {rate.ends_at.slice(0, 5)}
                                            </td>
                                            <td className="tnum py-2.5 text-right text-ink">{money(rate.amount_cents)}</td>
                                        </tr>
                                    )),
                                )}
                            </tbody>
                        </table>
                    </div>

                    {courts.every((c) => c.rates.length === 0) ? (
                        <p className="mt-6 text-sm text-ink-soft">
                            Todavía no hay tarifas cargadas. Un administrador puede definirlas desde el panel.
                        </p>
                    ) : null}
                </div>
            </section>

            <section className="border-t border-line bg-white py-14">
                <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 sm:grid-cols-2">
                    <div>
                        <SectionTitle id="horarios" title="Horarios y reservas" />
                        <ul className="mt-6 space-y-2 text-sm text-ink-soft">
                            <li>Reservas online hasta {policies.max_advance_days} días de anticipación.</li>
                            <li>Cancelación sin cargo hasta {policies.cancellation_hours} horas antes del turno.</li>
                            <li>
                                {policies.auto_confirm
                                    ? 'La reserva queda confirmada al crearla.'
                                    : 'El establecimiento confirma cada reserva, puede quedar pendiente unos minutos.'}
                            </li>
                        </ul>
                        <ul className="mt-6 space-y-1 border-t border-line pt-4 text-sm">
                            {courts.map((court) => (
                                <li key={court.id} className="flex flex-wrap justify-between gap-2 py-1">
                                    <span className="text-ink">{court.name}</span>
                                    <span className="text-ink-soft">{court.schedule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <SectionTitle id="ubicacion" title="Dónde estamos" />
                        <address className="mt-6 space-y-2 text-sm not-italic text-ink-soft">
                            {contact.address ? (
                                <p className="text-ink">
                                    {contact.address}
                                    {contact.city ? `, ${contact.city}` : ''}
                                </p>
                            ) : hasContactInfo ? (
                                <p>Dirección a confirmar.</p>
                            ) : (
                                <p>
                                    Falta cargar la dirección y los contactos del establecimiento desde el panel de
                                    configuración.
                                </p>
                            )}
                            {contact.phone ? (
                                <p>
                                    Teléfono:{' '}
                                    <a href={`tel:${contact.phone}`} className="text-ink underline decoration-line">
                                        {contact.phone}
                                    </a>
                                </p>
                            ) : null}
                            {contact.whatsapp ? (
                                <p>
                                    WhatsApp:{' '}
                                    <a
                                        href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                                        className="text-ink underline decoration-line"
                                    >
                                        {contact.whatsapp}
                                    </a>
                                </p>
                            ) : null}
                            {contact.email ? (
                                <p>
                                    Correo:{' '}
                                    <a href={`mailto:${contact.email}`} className="text-ink underline decoration-line">
                                        {contact.email}
                                    </a>
                                </p>
                            ) : null}
                        </address>

                        {contact.maps_url ? (
                            <a
                                href={contact.maps_url}
                                className="mt-4 inline-block rounded-control border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-ink hover:bg-paper"
                            >
                                Abrir el mapa
                            </a>
                        ) : null}

                        <div className="mt-8 rounded-card border border-line bg-paper p-4">
                            <p className="text-sm text-ink">¿Ya tenés cuenta?</p>
                            <p className="mt-1 text-sm text-ink-soft">
                                Ingresá para ver tus próximos turnos y cancelar sin llamar.
                            </p>
                            <a
                                href="/ingresar"
                                className="mt-3 inline-block text-sm font-medium text-accent underline decoration-accent/40"
                            >
                                Ingresar a mi cuenta
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
