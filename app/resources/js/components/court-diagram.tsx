/**
 * Court line art, drawn from the object the product sells. It stands in for the
 * photograph a real client has not uploaded yet, and it is labelled as such in
 * the court list. Stroke uses currentColor so it inherits the surface it sits on.
 */
export function CourtDiagram({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 120 76"
            role="img"
            aria-label="Diagrama de cancha"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
        >
            <rect x="1" y="1" width="118" height="74" />
            <rect x="7" y="7" width="106" height="62" />
            <line x1="60" y1="1" x2="60" y2="75" />
            <line x1="7" y1="24" x2="37" y2="24" />
            <line x1="7" y1="52" x2="37" y2="52" />
            <line x1="83" y1="24" x2="113" y2="24" />
            <line x1="83" y1="52" x2="113" y2="52" />
            <line x1="37" y1="24" x2="37" y2="52" />
            <line x1="83" y1="24" x2="83" y2="52" />
            <line x1="37" y1="38" x2="83" y2="38" strokeDasharray="3 3" />
        </svg>
    );
}
