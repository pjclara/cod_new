<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SearchRequest;
use App\Http\Resources\Icd10PcsResource;
use App\Models\Icd10Pcs;
use App\Services\Icd10PcsStructureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
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

        $codes = Icd10Pcs::with('subspecialty.specialty')
            ->when($request->filled('subspecialty_id'), fn ($q) => $q->where('subspecialty_id', $request->integer('subspecialty_id')))
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
            $icd10Pcs->load('subspecialty.specialty'),
        );
    }

    public function search(SearchRequest $request): AnonymousResourceCollection
    {
        $q = $request->validated('q');

        $results = Icd10Pcs::query()
            ->where('code', 'like', "{$q}%")
            ->orWhere('description', 'like', "%{$q}%")
            ->with('subspecialty')
            ->orderBy('code')
            ->limit(30)
            ->get();

        return Icd10PcsResource::collection($results);
    }

    public function assign(Request $request, Icd10Pcs $icd10Pcs): Icd10PcsResource
    {
        $validated = $request->validate([
            'subspecialty_id' => ['nullable', 'integer', 'exists:subspecialties,id'],
        ]);

        $icd10Pcs->update(['subspecialty_id' => $validated['subspecialty_id']]);

        Cache::forget('icd.stats');
        Cache::forget('icd.catalog.welcome');

        return new Icd10PcsResource($icd10Pcs->load('subspecialty.specialty'));
    }
}
