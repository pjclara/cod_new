<?php

namespace App\Http\Resources;

use App\Models\Icd10Cm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FavoriteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'favorable_id'    => $this->favorable_id,
            'favorable_type'  => $this->favorable_type,
            'favorable'       => $this->whenLoaded('favorable', function () {
                return $this->favorable instanceof Icd10Cm
                    ? new Icd10CmResource($this->favorable)
                    : new Icd10PcsResource($this->favorable);
            }),
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}
