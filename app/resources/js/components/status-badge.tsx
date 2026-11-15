import type { BookingStatus } from '@/types';

const labels: Record<BookingStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Finalizada',
    no_show: 'Ausente',
};

const tones: Record<BookingStatus, string> = {
    pending: 'border-accent/30 bg-accent-soft text-ink',
    confirmed: 'border-brand/25 bg-brand-soft text-brand',
    cancelled: 'border-line bg-paper-sunk text-ink-soft line-through',
    completed: 'border-line bg-paper text-ink-soft',
    no_show: 'border-ink/20 bg-ink text-paper',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-control border px-2 py-0.5 text-[11px] font-medium tracking-wide ${tones[status]}`}
        >
            {labels[status]}
        </span>
    );
}
