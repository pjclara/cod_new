<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class Icd10CmResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'subspecialty_id' => $this->subspecialty_id,
            'code'            => $this->code,
            'description'     => $this->description,
            'notes'           => $this->notes,
            'billable'        => $this->billable,
            'subspecialty'    => new SubspecialtyResource($this->whenLoaded('subspecialty')),
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}
