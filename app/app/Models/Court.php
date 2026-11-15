<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Court extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'sport', 'surface', 'description', 'photo_path',
        'is_active', 'slot_minutes', 'buffer_minutes', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'slot_minutes' => 'integer',
            'buffer_minutes' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(CourtSchedule::class);
    }

    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function blockedPeriods(): HasMany
    {
        return $this->hasMany(BlockedPeriod::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
