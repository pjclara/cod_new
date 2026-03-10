<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpecialtyResource;
use App\Models\Specialty;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SpecialtyController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SpecialtyResource::collection(
            Specialty::orderBy('name')->get(),
        );
    }

    public function show(Specialty $specialty): SpecialtyResource
    {
        return new SpecialtyResource(
            $specialty->load('subspecialties'),
        );
    }
}
