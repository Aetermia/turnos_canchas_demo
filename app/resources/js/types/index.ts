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
};

export type SharedProps = {
    auth: { user: AuthUser | null };
    flash: Flash;
    brand: Brand;
};
