<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Specialty extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function subspecialties(): HasMany
    {
        return $this->hasMany(Subspecialty::class);
    }

    public function icd10Cm(): HasManyThrough
    {
        return $this->hasManyThrough(Icd10Cm::class, Subspecialty::class);
    }

    public function icd10Pcs(): HasManyThrough
    {
        return $this->hasManyThrough(Icd10Pcs::class, Subspecialty::class);
    }
}
