<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PricingRule extends Model
{
    protected $fillable = ['court_id', 'weekday', 'starts_at', 'ends_at', 'amount_cents'];

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'amount_cents' => 'integer',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
