<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubspecialtyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'specialty_id'  => $this->specialty_id,
            'name'          => $this->name,
            'slug'          => $this->slug,
            'description'   => $this->description,
            'specialty'     => new SpecialtyResource($this->whenLoaded('specialty')),
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
