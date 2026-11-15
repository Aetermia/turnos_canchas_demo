import { Link, usePage } from '@inertiajs/react';
import type { CSSProperties, ReactNode } from 'react';

import { Flash } from '@/components/flash';
import { Wordmark } from '@/layouts/public-layout';
import type { SharedProps } from '@/types';

const items = [
    { href: '/panel', label: 'Resumen', adminOnly: false },
    { href: '/panel/calendario', label: 'Calendario', adminOnly: false },
    { href: '/panel/reservas', label: 'Reservas', adminOnly: false },
    { href: '/panel/clientes', label: 'Clientes', adminOnly: false },
    { href: '/panel/bloqueos', label: 'Bloqueos', adminOnly: false },
    { href: '/panel/canchas', label: 'Canchas', adminOnly: true },
    { href: '/panel/configuracion', label: 'Configuración', adminOnly: true },
];

export function AdminLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
    const { auth, brand } = usePage<SharedProps>().props;
    const url = usePage().url;
    const isAdmin = auth.user?.role === 'admin';

    const isActive = (href: string) => (href === '/panel' ? url === '/panel' : url.startsWith(href));

    const nav = items
        .filter((item) => !item.adminOnly || isAdmin)
        .map((item) => (
            <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`shrink-0 rounded-control px-3 py-2 text-sm transition-colors ${
                    isActive(item.href)
                        ? 'bg-brand-soft font-medium text-brand'
                        : 'text-ink-soft hover:bg-paper-sunk hover:text-ink'
                }`}
            >
                {item.label}
            </Link>
        ));

    return (
        <div style={{ '--color-accent': brand.accent } as CSSProperties} className="flex min-h-dvh flex-col bg-paper">
            <a
                href="#panel-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-brand focus:px-3 focus:py-2 focus:text-paper"
            >
                Saltar al contenido
            </a>

            <header className="border-b border-line bg-white">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
                    <div className="flex items-center gap-3">
                        <Wordmark name={brand.name} logo={brand.logo} />
                        <span className="hidden rounded-control bg-paper-sunk px-2 py-0.5 text-[11px] font-medium text-ink-soft sm:inline">
                            Panel
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <a href="/" className="rounded-control px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink">
                            Ver sitio
                        </a>
                        <Link
                            href="/salir"
                            method="post"
                            as="button"
                            className="rounded-control px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink"
                        >
                            Salir
                        </Link>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl overflow-x-auto px-2 pb-2 md:hidden">
                    <nav aria-label="Navegación del panel" className="flex gap-1">
                        {nav}
                    </nav>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
                <aside className="hidden w-52 shrink-0 md:block">
                    <nav aria-label="Navegación del panel" aria-orientation="vertical" className="sticky top-4 flex flex-col gap-1">
                        {nav}
                    </nav>
                </aside>

                <main id="panel-content" className="min-w-0 flex-1">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
                        {actions}
                    </div>

                    <div className="mb-5 empty:hidden">
                        <Flash />
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
}

export function Paginator({
    meta,
}: {
    meta: { from: number | null; to: number | null; total: number; prev_page_url: string | null; next_page_url: string | null };
}) {
    if (meta.total === 0) {
        return null;
    }

    return (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
            <p className="tnum">
                {meta.from}–{meta.to} de {meta.total}
            </p>
            <div className="flex gap-2">
                {meta.prev_page_url ? (
                    <Link
                        href={meta.prev_page_url}
                        preserveScroll
                        className="rounded-control border border-line px-3 py-1.5 text-ink hover:border-ink"
                    >
                        Anterior
                    </Link>
                ) : null}
                {meta.next_page_url ? (
                    <Link
                        href={meta.next_page_url}
                        preserveScroll
                        className="rounded-control border border-line px-3 py-1.5 text-ink hover:border-ink"
                    >
                        Siguiente
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
