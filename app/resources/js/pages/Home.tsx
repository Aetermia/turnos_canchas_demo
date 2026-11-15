import { Head, Link } from '@inertiajs/react';

import { ButtonLink } from '@/components/ui/button';
import { PublicLayout } from '@/layouts/public-layout';
import { longDate, money } from '@/lib/format';
import type { Board, BoardCell, CourtCard } from '@/types';

type Props = {
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
    courts: CourtCard[];
    board: Board;
};

const weekdayNames = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function sportsLabel(courts: CourtCard[]): string {
    const sports = [...new Set(courts.map((c) => c.sport))];

    if (sports.length === 0) {
        return 'Canchas';
    }

    if (sports.length === 1) {
        return sports[0];
    }

    return `${sports.slice(0, -1).join(', ')} y ${sports[sports.length - 1]}`;
}

function SectionHeading({ index, title, note }: { index: string; title: string; note?: string }) {
    return (
        <div id={index} className="scroll-mt-24">
            <div className="flex items-baseline gap-3">
                <span className="board-label">{index}</span>
                <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
            </div>
            {note ? <p className="mt-2 max-w-prose text-sm text-ink-soft">{note}</p> : null}
        </div>
    );
}

function Legend() {
    return (
        <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft">
            <li className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3.5 border border-accent bg-accent" />
                Turno libre, con su precio
            </li>
            <li className="flex items-center gap-2">
                <span aria-hidden="true" className="board-cell board-cell-taken size-3.5" />
                Ocupado
            </li>
            <li className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3.5 border border-line bg-paper-sunk" />
                Ya pasó o no se puede reservar
            </li>
        </ul>
    );
}

function BoardCellView({
    courtId,
    courtName,
    cell,
    date,
}: {
    courtId: number;
    courtName: string;
    cell: BoardCell;
    date: string;
}) {
    const label = `${courtName} a las ${cell.start}`;

    if (cell.state === 'free') {
        return (
            <Link
                href={`/reservar?court=${courtId}&date=${date}&start=${cell.start}`}
                aria-label={`Reservar ${label}, ${money(cell.price_cents)}`}
                className="board-cell board-cell-free flex min-h-11 items-center justify-center border-accent/60 bg-accent px-1 text-[12px] leading-tight font-semibold text-ink"
                style={{ gridColumn: `${cell.col + 2} / span ${cell.span}` }}
            >
                <span className="tnum">{money(cell.price_cents)}</span>
            </Link>
        );
    }

    const taken = cell.state === 'taken';

    return (
        <div
            className={`board-cell flex min-h-11 items-center justify-center ${
                taken ? 'board-cell-taken' : 'bg-paper-sunk'
            }`}
            style={{ gridColumn: `${cell.col + 2} / span ${cell.span}` }}
        >
            <span className="sr-only">{taken ? `Ocupado: ${label}` : `No disponible: ${label}`}</span>
        </div>
    );
}

/**
 * Below the wide breakpoint a 30 column board is hostile even with a scrollbar,
 * so the same data is read as a list of hours per court.
 */
function CourtHours({ board }: { board: Board }) {
    return (
        <ul className="mt-6 border-t border-ink/20 md:hidden">
            {board.rows.map((row) => {
                const bookable = row.cells.filter((cell) => cell.state !== 'past');

                return (
                    <li key={row.id} className="border-b border-line py-3">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold text-ink">{row.name}</p>
                            <p className="text-[11px] text-ink-soft">
                                {row.sport} · {row.slot_minutes} min
                            </p>
                        </div>

                        {!row.is_open ? (
                            <p className="mt-1 text-sm text-ink-soft">Cerrada hoy.</p>
                        ) : bookable.length === 0 ? (
                            <p className="mt-1 text-sm text-ink-soft">Sin turnos para hoy.</p>
                        ) : (
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                {bookable.map((cell) =>
                                    cell.state === 'free' ? (
                                        <li key={cell.start}>
                                            <Link
                                                href={`/reservar?court=${row.id}&date=${board.date}&start=${cell.start}`}
                                                className="tnum block border border-accent bg-accent px-2 py-1.5 text-[12px] font-semibold text-ink"
                                            >
                                                {cell.start}
                                                <span className="ml-1.5 font-normal">{money(cell.price_cents)}</span>
                                            </Link>
                                        </li>
                                    ) : (
                                        <li key={cell.start}>
                                            <span className="tnum block border border-line bg-paper-sunk px-2 py-1.5 text-[12px] text-ink-soft line-through">
                                                {cell.start}
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function BoardTable({ board }: { board: Board }) {
    const template = `8.5rem repeat(${board.columns}, minmax(0, 1fr))`;

    if (board.rows.length === 0) {
        return (
            <p className="mt-6 border-y border-ink/20 py-6 text-sm text-ink-soft">
                Todavía no hay canchas publicadas. Un administrador tiene que cargarlas desde el panel.
            </p>
        );
    }

    return (
        <div className="mt-6 hidden overflow-x-auto border-y border-ink/20 md:block">
            <div className="min-w-[720px]" role="table" aria-label="Turnos de hoy por cancha y horario">
                <div
                    className="grid border-b border-ink/20"
                    style={{ gridTemplateColumns: template }}
                    role="row"
                >
                    <div role="columnheader" className="board-label sticky left-0 z-10 bg-paper px-3 py-2">
                        Cancha
                    </div>
                    {board.hours.map((hour) => (
                        <div
                            key={hour}
                            role="columnheader"
                            style={{ gridColumn: 'span 2' }}
                            className="border-l border-line px-2 py-2 text-[11px] text-ink-soft"
                        >
                            {hour}
                        </div>
                    ))}
                </div>

                {board.rows.map((row) => (
                    <div
                        key={row.id}
                        role="row"
                        className="grid border-b border-line last:border-0"
                        style={{ gridTemplateColumns: template }}
                    >
                        <div
                            role="rowheader"
                            className="sticky left-0 z-10 border-r border-line bg-paper px-3 py-2"
                        >
                            <p className="text-sm font-semibold text-ink">{row.name}</p>
                            <p className="text-[11px] text-ink-soft">
                                {row.sport} · {row.slot_minutes} min
                            </p>
                            {row.is_open ? null : <p className="text-[11px] text-ink-soft">Cerrada hoy</p>}
                        </div>

                        {row.cells.map((cell) => (
                            <BoardCellView
                                key={`${row.id}-${cell.start}`}
                                courtId={row.id}
                                courtName={row.name}
                                cell={cell}
                                date={board.date}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Home({ contact, policies, courts, board }: Props) {
    const hasContactInfo = Boolean(
        contact.address || contact.phone || contact.whatsapp || contact.email || contact.maps_url,
    );
    const freeToday = board.rows.reduce(
        (sum, row) => sum + row.cells.filter((cell) => cell.state === 'free').length,
        0,
    );

    return (
        <PublicLayout>
            <Head title="Turnos de hoy" />

            <section className="mx-auto w-full max-w-6xl px-4 pt-8 pb-12" aria-labelledby="board-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="board-label">Turnos de hoy</p>
                        <h1
                            id="board-title"
                            className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl"
                        >
                            {longDate(board.date).replace(/^./, (letter) => letter.toUpperCase())}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
                            {sportsLabel(courts)}. {freeToday === 0 ? 'No quedan turnos libres para hoy.' : `${freeToday} turnos libres.`}{' '}
                            Tocá uno para reservarlo.
                        </p>
                    </div>

                    <ButtonLink href="/reservar" variant="outline">
                        Elegir otro día
                    </ButtonLink>
                </div>

                <CourtHours board={board} />
                <BoardTable board={board} />
                <Legend />
            </section>

            <section className="border-t border-ink/20 py-12">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <SectionHeading
                        index="01"
                        title="Canchas y tarifas"
                        note="El precio se calcula al confirmar y queda guardado en la reserva, aunque después cambie la tarifa."
                    />

                    {courts.length === 0 ? (
                        <p className="mt-6 text-sm text-ink-soft">No hay canchas cargadas.</p>
                    ) : (
                        <>
                        <ul className="mt-6 border-t border-ink/20 md:hidden">
                            {courts.map((court) => (
                                <li key={court.id} className="border-b border-line py-3">
                                    <p className="text-sm font-semibold text-ink">{court.name}</p>
                                    <p className="text-[11px] text-ink-soft">
                                        {court.sport} · turnos de {court.slot_minutes} min
                                    </p>
                                    {court.rates.length === 0 ? (
                                        <p className="mt-2 text-sm text-ink-soft">Sin tarifa cargada.</p>
                                    ) : (
                                        <ul className="mt-2 space-y-1">
                                            {court.rates.map((rate, index) => (
                                                <li key={index} className="flex justify-between gap-3 text-sm">
                                                    <span className="text-ink-soft">
                                                        {rate.weekday === null ? 'Todos los días' : weekdayNames[rate.weekday]} ·{' '}
                                                        {rate.starts_at.slice(0, 5)} a {rate.ends_at.slice(0, 5)}
                                                    </span>
                                                    <span className="tnum shrink-0 text-ink">
                                                        {money(rate.amount_cents)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[560px] border-collapse text-sm">
                                <caption className="sr-only">
                                    Canchas, días, franjas horarias y valor del turno
                                </caption>
                                <thead>
                                    <tr className="border-b border-ink/25 text-left">
                                        <th scope="col" className="board-label py-2 pr-4">
                                            Cancha
                                        </th>
                                        <th scope="col" className="board-label py-2 pr-4">
                                            Día
                                        </th>
                                        <th scope="col" className="board-label py-2 pr-4">
                                            Horario
                                        </th>
                                        <th scope="col" className="board-label py-2 text-right">
                                            Valor del turno
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courts.flatMap((court) =>
                                        (court.rates.length > 0 ? court.rates : [null]).map((rate, index) => (
                                            <tr key={`${court.id}-${index}`} className="border-b border-line">
                                                <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                                                    {index === 0 ? (
                                                        <>
                                                            {court.name}
                                                            <span className="block text-[11px] font-normal text-ink-soft">
                                                                {court.sport} · turnos de {court.slot_minutes} min
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="sr-only">{court.name}</span>
                                                    )}
                                                </th>
                                                <td className="py-2.5 pr-4 text-ink-soft">
                                                    {rate === null
                                                        ? 'Sin tarifa cargada'
                                                        : rate.weekday === null
                                                          ? 'Todos los días'
                                                          : weekdayNames[rate.weekday]}
                                                </td>
                                                <td className="tnum py-2.5 pr-4 text-ink-soft">
                                                    {rate === null
                                                        ? 'Consultar'
                                                        : `${rate.starts_at.slice(0, 5)} a ${rate.ends_at.slice(0, 5)}`}
                                                </td>
                                                <td className="tnum py-2.5 text-right text-ink">
                                                    {rate === null ? 'A definir' : money(rate.amount_cents)}
                                                </td>
                                            </tr>
                                        )),
                                    )}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}
                </div>
            </section>

            <section className="border-t border-ink/20 py-12">
                <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:grid-cols-2">
                    <div>
                        <SectionHeading index="02" title="Horarios de atención" />
                        <ul className="mt-6 space-y-1 text-sm">
                            {courts.map((court) => (
                                <li key={court.id} className="flex flex-wrap justify-between gap-2 border-b border-line py-1.5">
                                    <span className="text-ink">{court.name}</span>
                                    <span className="text-ink-soft">{court.schedule}</span>
                                </li>
                            ))}
                        </ul>

                        <ul className="mt-6 space-y-2 text-sm text-ink-soft">
                            <li>Reservás hasta {policies.max_advance_days} días de anticipación.</li>
                            <li>Cancelás sin cargo hasta {policies.cancellation_hours} horas antes.</li>
                            <li>
                                {policies.auto_confirm
                                    ? 'La reserva queda confirmada al crearla.'
                                    : 'El club revisa cada reserva antes de confirmarla.'}
                            </li>
                        </ul>
                    </div>

                    <div>
                        <SectionHeading index="03" title="Dónde y cómo" />
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
                                    Falta cargar la dirección y los contactos desde el panel de configuración.
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
                                className="mt-4 inline-block border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-ink hover:bg-paper-sunk"
                            >
                                Abrir el mapa
                            </a>
                        ) : null}

                        <p className="mt-8 border-t border-line pt-4 text-sm text-ink-soft">
                            ¿Ya tenés cuenta?{' '}
                            <Link href="/ingresar" className="font-medium text-brand underline">
                                Ingresá para ver tus turnos
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>

            <section className="border-t border-ink/20 bg-paper-sunk py-10">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="max-w-xl text-sm text-ink-soft">
                            {contact.about ?? 'Elegí cancha, día y horario, y confirmá en el momento.'}
                        </p>
                        <ButtonLink href="/reservar" variant="primary">
                            Reservar un turno
                        </ButtonLink>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
