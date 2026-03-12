<?php

namespace App\Http\Controllers\Icd;

use App\Http\Controllers\Controller;
use App\Models\Icd10Cm;
use App\Models\Icd10Pcs;
use App\Models\Specialty;
use App\Models\Subspecialty;
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
            'cm'           => Icd10Cm::count(),
            'pcs'          => Icd10Pcs::count(),
            'specialties'  => Specialty::count(),
            'cmUnassigned' => Icd10Cm::whereNull('subspecialty_id')->count(),
            'pcsUnassigned' => Icd10Pcs::whereNull('subspecialty_id')->count(),
            'cmSurgery' => Icd10Cm::whereIn(
                'subspecialty_id',
                Subspecialty::where('specialty_id', 10)->pluck('id')
            )->count(),
            'pcsSurgery' => Icd10Pcs::whereIn(
                'subspecialty_id',
                Subspecialty::where('specialty_id', 10)->pluck('id')
            )->count(),
        ]);

        $catalog = Cache::remember('icd.catalog.welcome', now()->addHour(), function () {
            return Specialty::query()
                ->withCount(['icd10Cm', 'icd10Pcs'])
                ->with([
                    'subspecialties' => fn ($query) => $query
                        ->withCount(['icd10Cm', 'icd10Pcs'])
                        ->orderBy('name'),
                ])
                ->orderBy('name')
                ->get()
                ->map(function (Specialty $specialty) {
                    $subspecialties = $specialty->subspecialties
                        ->filter(fn (Subspecialty $sub) => (($sub->icd10_cm_count ?? 0) + ($sub->icd10_pcs_count ?? 0)) > 0)
                        ->values()
                        ->map(fn (Subspecialty $sub) => [
                            'id' => $sub->id,
                            'name' => $sub->name,
                            'slug' => $sub->slug,
                            'cm_count' => (int) ($sub->icd10_cm_count ?? 0),
                            'pcs_count' => (int) ($sub->icd10_pcs_count ?? 0),
                        ]);

                    return [
                        'id' => $specialty->id,
                        'name' => $specialty->name,
                        'slug' => $specialty->slug,
                        'cm_count' => (int) ($specialty->icd10_cm_count ?? 0),
                        'pcs_count' => (int) ($specialty->icd10_pcs_count ?? 0),
                        'subspecialties' => $subspecialties,
                    ];
                })
                ->filter(fn (array $specialty) => ($specialty['cm_count'] + $specialty['pcs_count']) > 0 && count($specialty['subspecialties']) > 0)
                ->values();
        });

        return Inertia::render('welcome', [
            'canRegister' => \Laravel\Fortify\Features::enabled(\Laravel\Fortify\Features::registration()),
            'stats'       => $stats,
            'catalog'     => $catalog,
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
