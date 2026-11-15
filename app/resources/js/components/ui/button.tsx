import { Link } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

const base =
    'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50';

const variants: Record<Variant, string> = {
    primary: 'bg-brand text-paper hover:brightness-110',
    accent: 'bg-accent on-accent hover:brightness-95',
    outline: 'border border-line bg-transparent text-ink hover:border-ink hover:bg-paper-sunk',
    ghost: 'text-ink hover:bg-paper-sunk',
};

const sizes: Record<Size, string> = {
    sm: 'h-9 px-3 text-[13px]',
    md: 'h-11 px-4 text-sm',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string): string {
    return cn(base, variants[variant], sizes[size], extra);
}

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    type = 'button',
    ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
    return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
    href,
    variant = 'primary',
    size = 'md',
    className,
    children,
}: {
    href: string;
    variant?: Variant;
    size?: Size;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Link href={href} className={buttonClass(variant, size, className)}>
            {children}
        </Link>
    );
}
