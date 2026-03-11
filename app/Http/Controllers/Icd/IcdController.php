<?php

namespace App\Http\Controllers\Icd;

use App\Http\Controllers\Controller;
use App\Models\Icd10Cm;
use App\Models\Icd10Pcs;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class IcdController extends Controller
{
    /**
     * App landing page — passes stats + canRegister flag.
     */
    public function welcome(): Response
    {
        $stats = Cache::remember('icd.stats', now()->addHour(), fn () => [
            'cm'          => Icd10Cm::count(),
            'pcs'         => Icd10Pcs::count(),
            'specialties' => Specialty::count(),
        ]);

        return Inertia::render('welcome', [
            'canRegister' => \Laravel\Fortify\Features::enabled(\Laravel\Fortify\Features::registration()),
            'stats'       => $stats,
        ]);
    }

    /**
     * ICD-10 home — passes pre-counted stats from cache.
     */
    public function index(): Response
    {
        $stats = Cache::remember('icd.stats', now()->addHour(), fn () => [
            'cm'          => Icd10Cm::count(),
            'pcs'         => Icd10Pcs::count(),
            'specialties' => Specialty::count(),
        ]);

        return Inertia::render('icd/index', ['stats' => $stats]);
    }

    /**
     * Subspecialty list for a given specialty.
     */
    public function subspecialties(int $specialty): Response
    {
        return Inertia::render('icd/subspecialties', ['specialtyId' => $specialty]);
    }

    /**
     * ICD-10-CM code list (optionally filtered by subspecialty).
     */
    public function cmIndex(Request $request): Response
    {
        return Inertia::render('icd/cm/index', [
            'subspecialtyId' => $request->integer('subspecialty_id') ?: null,
        ]);
    }

    /**
     * ICD-10-CM code detail.
     */
    public function cmShow(string $code): Response
    {
        return Inertia::render('icd/cm/show', ['code' => strtoupper($code)]);
    }

    /**
     * ICD-10-PCS code list (optionally filtered by subspecialty).
     */
    public function pcsIndex(Request $request): Response
    {
        return Inertia::render('icd/pcs/index', [
            'subspecialtyId' => $request->integer('subspecialty_id') ?: null,
        ]);
    }

    /**
     * ICD-10-PCS code detail.
     */
    public function pcsShow(string $code): Response
    {
        return Inertia::render('icd/pcs/show', ['code' => strtoupper($code)]);
    }
}
