<?php

namespace App\Http\Requests\Api;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', Rule::in(array_merge(Order::WORKFLOW_STATUSES, ['processing', 'completed']))],
            'customer_name' => 'sometimes|string|max:255',
            'customer_email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|max:50',
            'address_line' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:120',
            'payment_method' => 'sometimes|string|in:cod,card,bank',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
