<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'image' => $this->image,
            'category' => $this->category,
            'sizes' => $this->sizes ?? [],
            'featured' => (bool) $this->featured,
            'stock_quantity' => (int) $this->stock_quantity,
            'is_popular' => (bool) $this->is_popular,
            'is_low_stock' => (int) $this->stock_quantity > 0 && (int) $this->stock_quantity <= 5,
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'reviews_avg_rating' => $this->reviews_avg_rating ? round((float) $this->reviews_avg_rating, 2) : null,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
