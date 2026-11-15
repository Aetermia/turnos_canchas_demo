import { usePage } from '@inertiajs/react';

import type { SharedProps } from '@/types';

export function Flash() {
    const { flash } = usePage<SharedProps>().props;

    if (!flash.success && !flash.error) {
        return null;
    }

    const tone = flash.error
        ? 'border-accent/40 bg-accent-soft text-ink'
        : 'border-brand/30 bg-brand-soft text-ink';

    return (
        <div role="status" aria-live="polite" className={`rounded-control border px-3 py-2 text-sm ${tone}`}>
            {flash.error ?? flash.success}
        </div>
    );
}
