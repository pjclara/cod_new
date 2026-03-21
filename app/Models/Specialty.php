<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialty extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function subspecialties(): HasMany
    {
        return $this->hasMany(Subspecialty::class);
    }
}
