<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Icd10Pcs extends Model
{
    protected $table = 'icd10_pcs';

    protected $fillable = ['subspecialty_id', 'code', 'description', 'notes'];

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

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('code', 'like', "{$term}%")
            ->orWhere('description', 'like', "%{$term}%");
    }
}
