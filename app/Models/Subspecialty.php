<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subspecialty extends Model
{
    protected $fillable = ['specialty_id', 'name', 'slug', 'description'];

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    public function icd10Cm(): BelongsToMany
    {
        return $this->belongsToMany(Icd10Cm::class, 'icd10_cm_subspecialty', 'subspecialty_id', 'icd10_cm_id');
    }

    public function icd10Pcs(): BelongsToMany
    {
        return $this->belongsToMany(Icd10Pcs::class, 'icd10_pcs_subspecialty', 'subspecialty_id', 'icd10_pcs_id');
    }
}
