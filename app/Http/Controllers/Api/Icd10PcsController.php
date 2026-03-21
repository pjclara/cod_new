<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SearchRequest;
use App\Http\Resources\Icd10PcsResource;
use App\Models\Icd10Pcs;
use Illuminate\Http\JsonResponse;
use App\Services\Icd10PcsStructureService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class Icd10PcsController extends Controller
{
    public function structure(Request $request, Icd10PcsStructureService $service): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'prefix' => ['nullable', 'string', 'max:7', 'regex:/^[A-HJ-NP-Z0-9]*$/i'],
        ])->validate();

        return response()->json(
            $service->getNode($validated['prefix'] ?? ''),
        );
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = Validator::make($request->all(), [
            'code_prefix' => ['nullable', 'string', 'max:7', 'regex:/^[A-HJ-NP-Z0-9]*$/i'],
        ])->validate();

        $codes = Icd10Pcs::with('subspecialties.specialty')
            ->when($request->filled('subspecialty_id'), fn ($q) => $q->whereHas('subspecialties', fn ($q) => $q->where('subspecialties.id', $request->integer('subspecialty_id'))))
            ->when(
                filled($validated['code_prefix'] ?? null),
                fn ($q) => $q->where('code', 'like', strtoupper($validated['code_prefix']).'%')
            )
            ->orderBy('code')
            ->paginate(50);

        return Icd10PcsResource::collection($codes);
    }

    public function show(Icd10Pcs $icd10Pcs): Icd10PcsResource
    {
        return new Icd10PcsResource(
            $icd10Pcs->load('subspecialties.specialty'),
        );
    }

    public function search(SearchRequest $request): AnonymousResourceCollection
    {
        $q = $request->validated('q');

        $results = Icd10Pcs::query()
            ->where('code', 'like', "{$q}%")
            ->orWhere('description', 'like', "%{$q}%")
            ->with('subspecialties')
            ->orderBy('code')
            ->limit(30)
            ->get();

        return Icd10PcsResource::collection($results);
    }

    public function assign(Request $request, Icd10Pcs $icd10Pcs): Icd10PcsResource
    {
        $validated = $request->validate([
            'subspecialty_ids'   => ['present', 'array'],
            'subspecialty_ids.*' => ['integer', 'exists:subspecialties,id'],
        ]);

        $icd10Pcs->subspecialties()->sync($validated['subspecialty_ids']);

        Cache::forget('icd.stats');
        Cache::forget('icd.catalog.welcome');

        return new Icd10PcsResource($icd10Pcs->load('subspecialties.specialty'));
    }

    public function bulkAssign(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'codes'              => ['required', 'array', 'min:1', 'max:200'],
            'codes.*'            => ['required', 'string', 'exists:icd10_pcs,code'],
            'subspecialty_ids'   => ['present', 'array'],
            'subspecialty_ids.*' => ['integer', 'exists:subspecialties,id'],
        ]);

        $pcsIds = Icd10Pcs::whereIn('code', $validated['codes'])->pluck('id');

        if (!empty($validated['subspecialty_ids'])) {
            $now     = now();
            $inserts = [];
            foreach ($pcsIds as $pcsId) {
                foreach ($validated['subspecialty_ids'] as $subId) {
                    $inserts[] = [
                        'icd10_pcs_id'    => $pcsId,
                        'subspecialty_id' => $subId,
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ];
                }
            }
            DB::table('icd10_pcs_subspecialty')->insertOrIgnore($inserts);
        }

        Cache::forget('icd.stats');
        Cache::forget('icd.catalog.welcome');

        return response()->json(['updated' => count($validated['codes'])]);
    }
}
