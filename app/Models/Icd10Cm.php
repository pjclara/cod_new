<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Icd10Cm extends Model
{
    protected $table = 'icd10_cm';

    protected $fillable = ['code', 'description', 'notes', 'valid'];

    protected static function booted(): void
    {
        static::addGlobalScope('valid', fn (Builder $q) => $q->where('valid', true));
    }

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

    public function subspecialties(): BelongsToMany
    {
        return $this->belongsToMany(Subspecialty::class, 'icd10_cm_subspecialty', 'icd10_cm_id', 'subspecialty_id');
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
