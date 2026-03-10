<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubspecialtyResource;
use App\Models\Specialty;
use App\Models\Subspecialty;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubspecialtyController extends Controller
{
    public function index(Specialty $specialty): AnonymousResourceCollection
    {
        return SubspecialtyResource::collection(
            $specialty->subspecialties()->orderBy('name')->get(),
        );
    }

    public function show(Subspecialty $subspecialty): SubspecialtyResource
    {
        return new SubspecialtyResource(
            $subspecialty->load('specialty'),
        );
    }
}
