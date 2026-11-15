export type Role = 'admin' | 'receptionist' | 'customer';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
};

export type Brand = {
    name: string;
    accent: string;
    /** Text colour that keeps AA contrast on top of the configured accent. */
    accent_ink: string;
    logo: string | null;
};

export type Flash = {
    success: string | null;
    error: string | null;
};

export type Slot = {
    start: string;
    end: string;
    price_cents: number | null;
    available: boolean;
    reason: string | null;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type BookingRow = {
    id: number;
    code: string;
    starts_at: string;
    ends_at: string;
    status: BookingStatus;
    price_cents: number;
    court: { id: number; name: string; sport: string };
    customer?: { id: number; name: string; phone: string | null };
    can_cancel?: boolean;
};

export type CourtCard = {
    id: number;
    name: string;
    slug: string;
    sport: string;
    surface: string | null;
    description: string | null;
    slot_minutes: number;
    price_from_cents: number | null;
    opens_at: string | null;
    closes_at: string | null;
    next_free: string | null;
    free_today: number;
    schedule: string;
    rates: Array<{ weekday: number | null; starts_at: string; ends_at: string; amount_cents: number }>;
};

export type SharedProps = {
    auth: { user: AuthUser | null };
    flash: Flash;
    brand: Brand;
};

export type BoardCell = {
    start: string;
    col: number;
    span: number;
    state: 'free' | 'taken' | 'past' | 'closed';
    price_cents: number | null;
    reason: string | null;
};

export type BoardRow = {
    id: number;
    name: string;
    sport: string;
    slot_minutes: number;
    is_open: boolean;
    opens: string | null;
    closes: string | null;
    cells: BoardCell[];
};

export type Board = {
    date: string;
    unit_minutes: number;
    from: string;
    to: string;
    columns: number;
    hours: string[];
    rows: BoardRow[];
};
