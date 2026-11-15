<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'user_id', 'court_id', 'created_by',
        'starts_at', 'ends_at', 'duration_minutes', 'price_cents',
        'status', 'notes', 'confirmed_at', 'cancelled_at', 'cancelled_by', 'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'duration_minutes' => 'integer',
            'price_cents' => 'integer',
            'status' => BookingStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /** Bookings that occupy a slot, given the establishment's pending policy. */
    public function scopeOccupying(Builder $query, bool $pendingBlocksSlot): void
    {
        $query->whereIn('status', BookingStatus::occupying($pendingBlocksSlot));
    }

    public function scopeOverlapping(Builder $query, int $courtId, string $from, string $to): void
    {
        $query->where('court_id', $courtId)
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from);
    }

    public static function generateCode(): string
    {
        do {
            $code = 'BK-'.Str::upper(Str::random(6));
        } while (self::query()->where('code', $code)->exists());

        return $code;
    }

    public function canBeCancelledByCustomer(): bool
    {
        if ($this->status !== BookingStatus::Confirmed && $this->status !== BookingStatus::Pending) {
            return false;
        }

        $hours = EstablishmentSetting::current()->cancellation_hours;

        return now()->addHours($hours)->lessThanOrEqualTo($this->starts_at);
    }
}
