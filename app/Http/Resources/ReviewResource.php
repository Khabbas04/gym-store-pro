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
            'rating' => (int) $this->rating,
            'comment' => $this->comment,
            'user' => [
                'id' => $this->user_id,
                'name' => optional($this->user)->name,
            ],
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
