import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

const control =
    'w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand';

export function Field({
    label,
    htmlFor,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
                {label}
            </label>
            {children}
            {hint && !error ? <p className="text-xs text-ink-soft">{hint}</p> : null}
            {error ? (
                <p id={`${htmlFor}-error`} className="text-xs font-medium text-accent">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
    return <input className={cn(control, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
    return (
        <select className={cn(control, 'pr-8', className)} {...props}>
            {children}
        </select>
    );
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
    return <textarea className={cn(control, 'min-h-24', className)} {...props} />;
}

export function Checkbox({ label, id, ...props }: ComponentProps<'input'> & { label: string }) {
    return (
        <div className="flex items-center gap-2">
            <input
                id={id}
                type="checkbox"
                className="size-4 rounded-[3px] border border-line text-brand accent-[color:var(--color-brand)]"
                {...props}
            />
            <label htmlFor={id} className="text-sm text-ink">
                {label}
            </label>
        </div>
    );
}
