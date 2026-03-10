<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreFavoriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth enforced by route middleware
    }

    public function rules(): array
    {
        return [
            'favorable_id'   => ['required', 'integer'],
            'favorable_type' => ['required', 'in:icd10_cm,icd10_pcs'],
        ];
    }
}
