import { Link, usePage } from '@inertiajs/react';
import type { CSSProperties, ReactNode } from 'react';

import { Flash } from '@/components/flash';
import { ButtonLink } from '@/components/ui/button';
import type { SharedProps } from '@/types';

export function Wordmark({ name, logo }: { name: string; logo: string | null }) {
    return (
        <span className="flex items-center gap-2.5">
            {logo ? (
                <img src={logo} alt={name} width={32} height={32} className="size-8 object-contain" />
            ) : (
                <span aria-hidden="true" className="flex w-6 flex-col gap-1">
                    <span className="block h-1 w-6 bg-ink" />
                    <span className="block h-1 w-4 bg-accent" />
                </span>
            )}
            <span className="font-display text-[17px] font-semibold tracking-tight text-ink">{name}</span>
        </span>
    );
}

export function PublicLayout({ children }: { children: ReactNode }) {
    const { auth, brand } = usePage<SharedProps>().props;
    const { url } = usePage();
    // The booking page is already the booking flow: no self link in the header.
    const onBookingPage = url.startsWith('/reservar');

    return (
        <div style={{ '--color-accent': brand.accent, '--color-accent-ink': brand.accent_ink } as CSSProperties} className="flex min-h-dvh flex-col">
            <a
                href="#contenido"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-brand focus:px-3 focus:py-2 focus:text-paper"
            >
                Saltar al contenido
            </a>

            <header className="sticky top-0 z-20 border-b border-line bg-paper">
                <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
                    <Link href="/" aria-label="Ir al inicio">
                        <Wordmark name={brand.name} logo={brand.logo} />
                    </Link>

                    <nav aria-label="Navegación principal" className="flex items-center gap-1 sm:gap-3">
                        {auth.user ? (
                            <>
                                <Link
                                    href="/mis-reservas"
                                    className="hidden rounded-control px-3 py-2 text-sm text-ink hover:bg-paper-sunk sm:block"
                                >
                                    Mis reservas
                                </Link>
                                {auth.user.role !== 'customer' ? (
                                    <Link
                                        href="/panel"
                                        className="hidden rounded-control px-3 py-2 text-sm text-ink hover:bg-paper-sunk sm:block"
                                    >
                                        Panel
                                    </Link>
                                ) : null}
                                <Link
                                    href="/mi-cuenta"
                                    className="hidden rounded-control px-3 py-2 text-sm text-ink hover:bg-paper-sunk sm:block"
                                >
                                    Mi cuenta
                                </Link>
                                <Link
                                    href="/salir"
                                    method="post"
                                    as="button"
                                    className="rounded-control px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink"
                                >
                                    Salir
                                </Link>
                            </>
                        ) : (
                            <Link href="/ingresar" className="rounded-control px-3 py-2 text-sm text-ink hover:bg-paper-sunk">
                                Ingresar
                            </Link>
                        )}

                        {onBookingPage ? null : (
                            <ButtonLink href="/reservar" variant="accent" size="sm">
                                Reservar
                            </ButtonLink>
                        )}
                    </nav>
                </div>
            </header>

            <div className="mx-auto w-full max-w-5xl px-4 empty:hidden">
                <div className="pt-4">
                    <Flash />
                </div>
            </div>

            <main id="contenido" className="flex-1">
                {children}
            </main>

            <footer className="border-t border-line bg-paper-sunk">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        © {new Date().getFullYear()} {brand.name}. Turnos online.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a href="/reservar" className="hover:text-ink">
                            Reservar
                        </a>
                        {auth.user ? (
                            <a href="/mis-reservas" className="hover:text-ink">
                                Mis reservas
                            </a>
                        ) : (
                            <a href="/registro" className="hover:text-ink">
                                Crear cuenta
                            </a>
                        )}
                        <a href="#contenido" className="hover:text-ink">
                            Volver arriba
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
