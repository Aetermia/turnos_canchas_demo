<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'subject_type', 'subject_id', 'meta', 'ip'];

    protected function casts(): array
    {
        return ['meta' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(string $action, Model $subject, ?User $actor = null, array $meta = []): self
    {
        return self::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject::class,
            'subject_id' => $subject->getKey(),
            'meta' => $meta ?: null,
            'ip' => request()->ip(),
        ]);
    }
}
