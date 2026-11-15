<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Completed = 'completed';
    case NoShow = 'no_show';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente',
            self::Confirmed => 'Confirmada',
            self::Cancelled => 'Cancelada',
            self::Completed => 'Finalizada',
            self::NoShow => 'Ausente',
        };
    }

    public function isActive(): bool
    {
        return in_array($this, [self::Pending, self::Confirmed], true);
    }

    /**
     * Statuses that must be treated as occupied when checking availability.
     * A pending booking holds its slot only when the establishment configures it that way.
     */
    public static function occupying(bool $pendingBlocksSlot): array
    {
        return $pendingBlocksSlot
            ? [self::Pending->value, self::Confirmed->value]
            : [self::Confirmed->value];
    }
}
