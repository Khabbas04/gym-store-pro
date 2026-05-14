<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:20',
            'items.*.size' => 'nullable|string|max:32',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'address_line' => 'required|string|max:255',
            'city' => 'required|string|max:120',
            'payment_method' => 'required|string|in:cod,card,bank',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
