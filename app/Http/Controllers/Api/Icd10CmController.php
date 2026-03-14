<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SearchRequest;
use App\Http\Resources\Icd10CmResource;
use App\Models\Icd10Cm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class Icd10CmController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $codes = Icd10Cm::with('subspecialty.specialty')
            ->where('valid', 1)
            ->when($request->filled('subspecialty_id'), fn($q) => $q->where('subspecialty_id', $request->integer('subspecialty_id')))
            ->orderBy('code')
            ->paginate(50);

        return Icd10CmResource::collection($codes);
    }

    public function show(Icd10Cm $icd10Cm): Icd10CmResource
    {
        return new Icd10CmResource(
            $icd10Cm->load('subspecialty.specialty'),
        );
    }

    public function search(SearchRequest $request): AnonymousResourceCollection
    {
        $q = $request->validated('q');

        $results = Icd10Cm::query()
            ->where('code', 'like', "{$q}%")
            ->orWhere('description', 'like', "%{$q}%")
            ->with('subspecialty')
            ->orderBy('code')
            ->limit(30)
            ->get();

        return Icd10CmResource::collection($results);
    }

    public function assign(Request $request, Icd10Cm $icd10Cm): Icd10CmResource
    {
        $validated = $request->validate([
            'subspecialty_id' => ['nullable', 'integer', 'exists:subspecialties,id'],
        ]);

        $icd10Cm->update(['subspecialty_id' => $validated['subspecialty_id']]);

        Cache::forget('icd.stats');
        Cache::forget('icd.catalog.welcome');

        return new Icd10CmResource($icd10Cm->load('subspecialty.specialty'));
    }
}
