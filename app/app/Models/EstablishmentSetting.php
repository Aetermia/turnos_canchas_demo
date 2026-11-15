<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstablishmentSetting extends Model
{
    protected $fillable = [
        'name', 'tagline', 'about', 'logo_path', 'accent_color',
        'phone', 'whatsapp', 'email', 'address', 'city', 'maps_url',
        'currency', 'auto_confirm', 'pending_blocks_slot',
        'min_advance_minutes', 'max_advance_days', 'cancellation_hours',
    ];

    protected function casts(): array
    {
        return [
            'auto_confirm' => 'boolean',
            'pending_blocks_slot' => 'boolean',
            'min_advance_minutes' => 'integer',
            'max_advance_days' => 'integer',
            'cancellation_hours' => 'integer',
        ];
    }

    /**
     * Mirrors the column defaults so a freshly created model is usable without a reload.
     */
    protected $attributes = [
        'accent_color' => '#0f5c46',
        'currency' => 'ARS',
        'auto_confirm' => true,
        'pending_blocks_slot' => true,
        'min_advance_minutes' => 60,
        'max_advance_days' => 30,
        'cancellation_hours' => 24,
    ];

    private static ?self $cached = null;

    /**
     * The settings row for this installation, created with defaults on first access.
     */
    public static function current(): self
    {
        return self::$cached ??= self::query()->first() ?? self::create([
            'name' => config('app.name'),
        ]);
    }

    public static function forgetCache(): void
    {
        self::$cached = null;
    }

    protected static function booted(): void
    {
        static::saved(fn () => self::$cached = null);
        static::deleted(fn () => self::$cached = null);
    }
}
