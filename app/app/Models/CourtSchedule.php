<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourtSchedule extends Model
{
    public $timestamps = false;

    protected $fillable = ['court_id', 'weekday', 'is_open', 'opens_at', 'closes_at'];

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'is_open' => 'boolean',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
