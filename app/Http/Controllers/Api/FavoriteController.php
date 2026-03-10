<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreFavoriteRequest;
use App\Http\Resources\FavoriteResource;
use App\Models\Favorite;
use App\Models\Icd10Cm;
use App\Models\Icd10Pcs;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FavoriteController extends Controller
{
    use AuthorizesRequests;

    public function index(): AnonymousResourceCollection
    {
        $favorites = Favorite::where('user_id', auth()->id())
            ->with('favorable')
            ->latest()
            ->get();

        return FavoriteResource::collection($favorites);
    }

    public function store(StoreFavoriteRequest $request): FavoriteResource|JsonResponse
    {
        $typeMap = [
            'icd10_cm'  => Icd10Cm::class,
            'icd10_pcs' => Icd10Pcs::class,
        ];

        $favorite = Favorite::firstOrCreate([
            'user_id'        => auth()->id(),
            'favorable_id'   => $request->validated('favorable_id'),
            'favorable_type' => $typeMap[$request->validated('favorable_type')],
        ]);

        return (new FavoriteResource($favorite))
            ->response()
            ->setStatusCode($favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Favorite $favorite): JsonResponse
    {
        $this->authorize('delete', $favorite);

        $favorite->delete();

        return response()->json(null, 204);
    }
}
