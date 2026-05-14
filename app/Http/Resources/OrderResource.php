<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'shipping_fee' => (float) $this->shipping_fee,
            'total' => (float) $this->total,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'phone' => $this->phone,
            'address_line' => $this->address_line,
            'city' => $this->city,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'paid_at' => optional($this->paid_at)->toISOString(),
            'items_count' => $this->whenCounted('items'),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
