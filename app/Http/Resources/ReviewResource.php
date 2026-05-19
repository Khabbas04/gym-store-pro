<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', function() {
                return [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'image' => $this->product->image,
                ];
            }),
            'rating' => (int) $this->rating,
            'comment' => $this->comment,
            'status' => $this->status,
            'show_on_homepage' => (bool) $this->show_on_homepage,
            'user' => [
                'id' => $this->user_id,
                'name' => optional($this->user)->name,
            ],
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
