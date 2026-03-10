<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subspecialty extends Model
{
    protected $fillable = ['specialty_id', 'name', 'slug', 'description'];

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    public function icd10Cm(): HasMany
    {
        return $this->hasMany(Icd10Cm::class);
    }

    public function icd10Pcs(): HasMany
    {
        return $this->hasMany(Icd10Pcs::class);
    }
}
