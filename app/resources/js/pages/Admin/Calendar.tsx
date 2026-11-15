import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { addDaysIso, money, shortDate, time, todayIso } from '@/lib/format';
import type { BookingStatus } from '@/types';

type CalendarItem = {
    kind: 'booking' | 'block';
    id: number;
    column: string | null;
    starts_at: string;
    ends_at: string;
    status: BookingStatus | 'blocked';
    title: string;
    subtitle: string;
    price_cents: number | null;
    phone: string | null;
};

type Props = {
    view: 'day' | 'week';
    date: string;
    courts: Array<{ id: number; name: string; is_active: boolean }>;
    selected_court: number | null;
    columns: Array<{ key: string; label: string; hint: string }>;
    items: CalendarItem[];
    axis: { start: string; end: string };
};

const PX_PER_MINUTE = 1.15;

/** Times arrive as local ISO strings with an offset, so the literal clock time is the truth. */
function minutes(iso: string): number {
    const clock = iso.length > 10 ? iso.slice(11, 16) : iso;

    return Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
}

const tone: Record<string, string> = {
    confirmed: 'border-brand/40 bg-brand-soft text-ink hover:border-brand',
    pending: 'border-accent/50 bg-accent-soft text-ink hover:border-accent',
    completed: 'border-line bg-paper-sunk text-ink-soft',
    no_show: 'border-ink/30 bg-paper-sunk text-ink-soft',
    blocked:
        'border-ink/25 bg-[repeating-linear-gradient(135deg,var(--color-paper-sunk),var(--color-paper-sunk)_6px,var(--color-paper)_6px,var(--color-paper)_12px)] text-ink-soft',
};

export default function Calendar({ view, date, courts, selected_court, columns, items, axis }: Props) {
    const startMinutes = minutes(axis.start);
    const endMinutes = minutes(axis.end);
    const span = Math.max(endMinutes - startMinutes, 60);
    const height = span * PX_PER_MINUTE;

    function navigate(next: { view?: 'day' | 'week'; date?: string; court?: number }) {
        router.get(
            '/panel/calendario',
            {
                view: next.view ?? view,
                date: next.date ?? date,
                court: next.court ?? selected_court ?? undefined,
            },
            { preserveScroll: true, preserveState: false },
        );
    }

    function createAt(columnKey: string, offsetY: number) {
        const raw = startMinutes + offsetY / PX_PER_MINUTE;
        const rounded = Math.floor(raw / 30) * 30;
        const hour = String(Math.floor(rounded / 60)).padStart(2, '0');
        const minute = String(rounded % 60).padStart(2, '0');
        const targetDate = view === 'day' ? date : columnKey;

        router.get('/panel/reservas/nueva', {
            court: view === 'day' ? Number(columnKey) : selected_court,
            date: targetDate,
            time: `${hour}:${minute}`,
        });
    }

    const emptyCourt = courts.length === 0;

    return (
        <AdminLayout
            title="Calendario"
            actions={
                <Link
                    href="/panel/reservas/nueva"
                    className="rounded-control bg-accent px-3 py-2 text-sm font-medium text-paper hover:bg-[#8f3c19]"
                >
                    Nueva reserva
                </Link>
            }
        >
            <Head title="Calendario" />

            <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Vista del calendario" className="flex rounded-control border border-line bg-white p-0.5">
                    {(['day', 'week'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => navigate({ view: option })}
                            aria-pressed={view === option}
                            className={`rounded-[4px] px-3 py-1.5 text-sm ${
                                view === option ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
                            }`}
                        >
                            {option === 'day' ? 'Día' : 'Semana'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() =>
                            navigate({ date: addDaysIso(date, view === 'day' ? -1 : -7) })
                        }
                        className="rounded-control border border-line bg-white px-2.5 py-1.5 text-sm text-ink hover:border-ink"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate({ date: todayIso() })}
                        className="rounded-control border border-line bg-white px-2.5 py-1.5 text-sm text-ink hover:border-ink"
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate({ date: addDaysIso(date, view === 'day' ? 1 : 7) })}
                        className="rounded-control border border-line bg-white px-2.5 py-1.5 text-sm text-ink hover:border-ink"
                    >
                        Siguiente
                    </button>
                </div>

                {view === 'week' && courts.length > 0 ? (
                    <label className="flex items-center gap-2 text-sm text-ink-soft">
                        <span className="sr-only">Cancha</span>
                        <select
                            value={selected_court ?? ''}
                            onChange={(event) => navigate({ court: Number(event.target.value) })}
                            className="rounded-control border border-line bg-white px-2 py-1.5 text-sm text-ink"
                        >
                            {courts.map((court) => (
                                <option key={court.id} value={court.id}>
                                    {court.name}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}
            </div>

            <p className="mt-3 text-sm text-ink-soft capitalize">
                {view === 'day' ? shortDate(date) : `Semana del ${shortDate(date)}`}
            </p>

            {emptyCourt ? (
                <div className="mt-6 rounded-card border border-line bg-white p-6">
                    <p className="text-sm text-ink">Todavía no hay canchas cargadas.</p>
                    <p className="mt-1 text-sm text-ink-soft">Cargá una cancha para empezar a recibir reservas.</p>
                    <Link
                        href="/panel/canchas/nueva"
                        className="mt-3 inline-block rounded-control bg-brand px-3 py-2 text-sm font-medium text-paper"
                    >
                        Crear cancha
                    </Link>
                </div>
            ) : (
                <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white">
                    <div className="flex min-w-max">
                        <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-line bg-white">
                            <div className="h-11 border-b border-line" />
                            <div style={{ height }} className="relative">
                                {Array.from({ length: Math.ceil(span / 60) }).map((_, index) => {
                                    const hour = Math.floor((startMinutes + index * 60) / 60);

                                    return (
                                        <div
                                            key={index}
                                            className="tnum absolute right-1 text-[11px] text-ink-soft"
                                            style={{ top: index * 60 * PX_PER_MINUTE - 7 }}
                                        >
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {columns.map((column) => {
                            const columnItems = items.filter(
                                (item) => item.column === column.key || item.column === null,
                            );

                            return (
                                <div key={column.key} className="min-w-[168px] flex-1 border-r border-line last:border-r-0">
                                    <div className="flex h-11 flex-col justify-center border-b border-line px-2">
                                        <p className="truncate text-sm font-medium text-ink capitalize">{column.label}</p>
                                        <p className="truncate text-[11px] text-ink-soft">{column.hint}</p>
                                    </div>

                                    <div
                                        className="relative"
                                        style={{
                                            height,
                                            backgroundImage:
                                                'repeating-linear-gradient(to bottom, var(--color-line) 0 1px, transparent 1px ' +
                                                60 * PX_PER_MINUTE +
                                                'px)',
                                        }}                                        onClick={(event) => {
                                            if (event.currentTarget !== event.target) {
                                                return;
                                            }

                                            const box = event.currentTarget.getBoundingClientRect();
                                            createAt(column.key, event.clientY - box.top);
                                        }}
                                    >
                                        {columnItems.map((item) => {
                                            const top = (minutes(item.starts_at) - startMinutes) * PX_PER_MINUTE;
                                            const itemHeight = Math.max(
                                                (minutes(item.ends_at) - minutes(item.starts_at)) * PX_PER_MINUTE - 2,
                                                24,
                                            );

                                            const className = `absolute inset-x-1 overflow-hidden rounded-[5px] border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors ${tone[item.status] ?? tone.completed}`;

                                            return item.kind === 'booking' ? (
                                                <Link
                                                    key={`${item.kind}-${item.id}`}
                                                    href={`/panel/reservas/${item.id}`}
                                                    className={className}
                                                    style={{ top, height: itemHeight }}
                                                    title={`${item.title} · ${time(item.starts_at)} a ${time(item.ends_at)}`}
                                                >
                                                    <span className="tnum block font-medium">{time(item.starts_at)}</span>
                                                    <span className="block truncate">{item.title}</span>
                                                    {itemHeight > 46 && item.price_cents !== null ? (
                                                        <span className="tnum block text-[10px] opacity-80">
                                                            {money(item.price_cents)}
                                                        </span>
                                                    ) : null}
                                                </Link>
                                            ) : (
                                                <div
                                                    key={`${item.kind}-${item.id}-${column.key}`}
                                                    className={className}
                                                    style={{ top, height: itemHeight }}
                                                    title={item.title}
                                                >
                                                    <span className="block truncate font-medium">{item.title}</span>
                                                    <span className="block truncate text-[10px] opacity-80">Bloqueo</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-soft">
                <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-[3px] border border-brand/40 bg-brand-soft" aria-hidden="true" />
                    Confirmada
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-[3px] border border-accent/50 bg-accent-soft" aria-hidden="true" />
                    Pendiente
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-[3px] border border-ink/25 bg-paper-sunk" aria-hidden="true" />
                    Bloqueo
                </span>
                <span className="hidden sm:inline">Clic en un espacio libre para cargar una reserva a esa hora.</span>
            </div>
        </AdminLayout>
    );
}
