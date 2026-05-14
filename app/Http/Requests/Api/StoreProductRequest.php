<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|url',
            'category' => 'required|string|max:100',
            'sizes' => 'nullable',
            'featured' => 'nullable|boolean',
            'stock_quantity' => 'nullable|integer|min:0|max:99999',
            'is_popular' => 'nullable|boolean',
        ];
    }
}
