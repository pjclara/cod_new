<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Icd10Cm extends Model
{
    protected $table = 'icd10_cm';

    protected $fillable = ['subspecialty_id', 'code', 'description', 'notes', 'valid'];

    protected function casts(): array
    {
        return [
            'valid' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    // ── Relationships ────────────────────────────────────────────────────

    public function subspecialty(): BelongsTo
    {
        return $this->belongsTo(Subspecialty::class);
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favorable');
    }

    // ── Scopes ───────────────────────────────────────────────────────────

    public function scopeValid(Builder $query): Builder
    {
        return $query->where('valid', true);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('code', 'like', "{$term}%")
            ->orWhere('description', 'like', "%{$term}%");
    }
}
