<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedPeriod extends Model
{
    protected $fillable = ['court_id', 'starts_at', 'ends_at', 'reason', 'created_by'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Blocks that touch the given window, including establishment wide ones (court_id null).
     */
    public function scopeOverlapping(Builder $query, int $courtId, string $from, string $to): void
    {
        $query->where(fn (Builder $q) => $q->where('court_id', $courtId)->orWhereNull('court_id'))
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from);
    }
}
