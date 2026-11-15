const TZ = 'America/Argentina/Buenos_Aires';

const ars = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
});

/** Cents in, "$ 25.000" out. Prices are whole pesos in practice. */
export function money(cents: number | null | undefined): string {
    if (cents === null || cents === undefined) {
        return 'A definir';
    }

    return ars.format(Math.round(cents / 100)).replace(/\u00a0/g, ' ');
}

export function time(iso: string): string {
    return new Intl.DateTimeFormat('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: TZ,
    }).format(new Date(iso));
}

/**
 * Date only values (YYYY-MM-DD) have no timezone. Parsing them as UTC midnight
 * would show the previous day in Buenos Aires, so they are formatted as UTC.
 */
function formatDay(iso: string, options: Intl.DateTimeFormatOptions): string {
    const dateOnly = iso.length === 10;
    const date = dateOnly ? new Date(`${iso}T12:00:00Z`) : new Date(iso);

    return new Intl.DateTimeFormat('es-AR', {
        ...options,
        timeZone: dateOnly ? 'UTC' : TZ,
    }).format(date);
}

export function longDate(iso: string): string {
    return formatDay(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function shortDate(iso: string): string {
    return formatDay(iso, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** YYYY-MM-DD without shifting the day through a timezone conversion. */
export function isoDay(iso: string): string {
    return iso.slice(0, 10);
}

export function todayIso(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function addDaysIso(day: string, days: number): string {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));

    return date.toISOString().slice(0, 10);
}
