import { Link, usePage } from '@inertiajs/react';
import type { CSSProperties, ReactNode } from 'react';

import { Flash } from '@/components/flash';
import { Wordmark } from '@/layouts/public-layout';
import type { SharedProps } from '@/types';

export function AuthLayout({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
    const { brand } = usePage<SharedProps>().props;

    return (
        <div
            style={{ '--color-accent': brand.accent } as CSSProperties}
            className="flex min-h-dvh flex-col items-center justify-center px-4 py-10"
        >
            <Link href="/" className="mb-8">
                <Wordmark name={brand.name} logo={brand.logo} />
            </Link>

            <div className="w-full max-w-sm">
                <div className="court-rule mb-6" aria-hidden="true" />
                <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
                <p className="mt-1 mb-6 text-sm text-ink-soft">{intro}</p>

                <div className="mb-4">
                    <Flash />
                </div>

                {children}
            </div>

            <Link href="/" className="mt-10 text-sm text-ink-soft hover:text-ink">
                Volver al inicio
            </Link>
        </div>
    );
}
