<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SearchRequest;
use App\Http\Resources\Icd10CmResource;
use App\Models\Icd10Cm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class Icd10CmController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $codes = Icd10Cm::with('subspecialty.specialty')
            ->when($request->filled('subspecialty_id'), fn ($q) => $q->where('subspecialty_id', $request->integer('subspecialty_id')))
            ->when($request->filled('billable'), fn ($q) => $q->where('billable', filter_var($request->billable, FILTER_VALIDATE_BOOLEAN)))
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
}
