<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SearchRequest;
use App\Http\Resources\Icd10CmResource;
use App\Models\Icd10Cm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class Icd10CmController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $codes = Icd10Cm::with('subspecialties.specialty')
            ->when($request->filled('subspecialty_id'), fn ($q) => $q->whereHas('subspecialties', fn ($q) => $q->where('subspecialties.id', $request->integer('subspecialty_id'))))
            ->orderBy('code')
            ->paginate(50);

        return Icd10CmResource::collection($codes);
    }

    public function show(Icd10Cm $icd10Cm): Icd10CmResource
    {
        return new Icd10CmResource(
            $icd10Cm->load('subspecialties.specialty'),
        );
    }

    public function search(SearchRequest $request): AnonymousResourceCollection
    {
        $q = $request->validated('q');

        // Se o utilizador incluir % usa o padrão literalmente; caso contrário aplica defaults
        $hasWildcard = str_contains($q, '%');
        $codePattern = $hasWildcard ? $q : "{$q}%";
        $descPattern  = $hasWildcard ? $q : "%{$q}%";

        $results = Icd10Cm::query()
            ->where('code', 'like', $codePattern)
            ->orWhere('description', 'like', $descPattern)
            ->with('subspecialties')
            ->orderBy('code')
            ->limit(50)
            ->get();

        return Icd10CmResource::collection($results);
    }

    public function assign(Request $request, Icd10Cm $icd10Cm): Icd10CmResource
    {
        $validated = $request->validate([
            'subspecialty_ids'   => ['present', 'array'],
            'subspecialty_ids.*' => ['integer', 'exists:subspecialties,id'],
        ]);

        $icd10Cm->subspecialties()->sync($validated['subspecialty_ids']);

        Cache::forget('icd.stats');
        Cache::forget('icd.catalog.welcome');

        return new Icd10CmResource($icd10Cm->load('subspecialties.specialty'));
    }

    public function bulkAssign(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'codes'              => ['required', 'array', 'min:1', 'max:200'],
            'codes.*'            => ['required', 'string', 'exists:icd10_cm,code'],
            'subspecialty_ids'   => ['present', 'array'],
            'subspecialty_ids.*' => ['integer', 'exists:subspecialties,id'],
        ]);

        $cmIds = Icd10Cm::withoutGlobalScopes()->whereIn('code', $validated['codes'])->pluck('id');

        if (!empty($validated['subspecialty_ids'])) {
            $now     = now();
            $inserts = [];
            foreach ($cmIds as $cmId) {
                foreach ($validated['subspecialty_ids'] as $subId) {
                    $inserts[] = [
                        'icd10_cm_id'     => $cmId,
                        'subspecialty_id' => $subId,
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ];
                }
            }
            DB::table('icd10_cm_subspecialty')->insertOrIgnore($inserts);
        }

        Cache::forget('icd.stats');
        Cache::forget('icd.catalog.welcome');

        return response()->json(['updated' => count($validated['codes'])]);
    }
}
