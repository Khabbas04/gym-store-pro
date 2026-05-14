<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ProductService
{
    private ?bool $hasStockColumns = null;
    private ?bool $hasReviewsTable = null;

    public function getPaginatedProducts(Request $request): LengthAwarePaginator
    {
        $perPage = (int) $request->integer('per_page', 12);
        $perPage = $perPage > 0 ? min($perPage, 50) : 12;

        $query = Product::query()
            ->when($request->filled('q'), function (Builder $builder) use ($request) {
                $term = trim((string) $request->string('q'));

                $builder->where(function (Builder $inner) use ($term) {
                    $inner
                        ->where('name', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%")
                        ->orWhere('category', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('category'), function (Builder $builder) use ($request) {
                $builder->where('category', (string) $request->string('category'));
            })
            ->when($request->boolean('featured'), function (Builder $builder) {
                $builder->where('featured', true);
            });

        if ($this->supportsReviews()) {
            $query->withAvg('reviews', 'rating')->withCount('reviews');
        }

        $sort = (string) $request->string('sort', 'latest');
        if ($sort === 'price_asc') {
            $query->orderBy('price');
        } elseif ($sort === 'price_desc') {
            $query->orderByDesc('price');
        } elseif ($sort === 'popular' && $this->supportsStockColumns()) {
            $query->orderByDesc('is_popular')->orderByDesc('reviews_avg_rating');
        } else {
            $query->latest();
        }

        return $query->paginate($perPage);
    }

    public function create(array $payload): Product
    {
        return Product::query()->create($this->normalizePayload($payload));
    }

    public function update(Product $product, array $payload): Product
    {
        $product->update($this->normalizePayload($payload, $product));

        return $product->fresh();
    }

    public function getCategories(): array
    {
        return Cache::remember('catalog:categories', now()->addMinutes(30), static function () {
            return Product::query()
                ->select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values()
                ->all();
        });
    }

    public function getHomepageSections(): array
    {
        return Cache::remember('catalog:homepage', now()->addMinutes(15), function () {
            $popularQuery = Product::query();
            if ($this->supportsStockColumns()) {
                $popularQuery->where('is_popular', true)
                    ->orWhere('stock_quantity', '<=', 5);
            } else {
                $popularQuery->where('featured', true);
            }

            return [
                'featured' => Product::query()
                    ->where('featured', true)
                    ->latest()
                    ->take(8)
                    ->get(),
                'popular' => $popularQuery
                    ->latest()
                    ->take(8)
                    ->get(),
            ];
        });
    }

    public function getRelated(Product $product, int $limit = 6)
    {
        $query = Product::query()
            ->where('id', '!=', $product->id)
            ->where('category', $product->category)
            ->latest()
            ->take($limit);

        if ($this->supportsReviews()) {
            $query->withAvg('reviews', 'rating')->withCount('reviews');
        }

        return $query->get();
    }

    public function clearCaches(): void
    {
        Cache::forget('catalog:categories');
        Cache::forget('catalog:homepage');
    }

    private function normalizePayload(array $payload, ?Product $product = null): array
    {
        $stockValue = $payload['stock_quantity'] ?? null;
        $normalizedStock = ($stockValue === '' || $stockValue === null)
            ? 24
            : max(0, (int) $stockValue);

        return [
            'name' => $payload['name'],
            'slug' => ($product && $product->name === $payload['name'])
                ? $product->slug
                : Str::slug($payload['name']).'-'.now()->timestamp,
            'description' => $payload['description'] ?? null,
            'price' => $payload['price'],
            'image' => $payload['image'] ?? null,
            'category' => $payload['category'],
            'sizes' => isset($payload['sizes'])
                ? (is_array($payload['sizes']) ? $payload['sizes'] : array_map('trim', explode(',', (string) $payload['sizes'])))
                : ['M', 'L'],
            'featured' => (bool) ($payload['featured'] ?? false),
            ...($this->supportsStockColumns() ? [
                'stock_quantity' => $normalizedStock,
                'is_popular' => (bool) ($payload['is_popular'] ?? false),
            ] : []),
        ];
    }

    private function supportsStockColumns(): bool
    {
        if ($this->hasStockColumns !== null) {
            return $this->hasStockColumns;
        }

        $this->hasStockColumns = Schema::hasColumn('products', 'stock_quantity')
            && Schema::hasColumn('products', 'is_popular');

        return $this->hasStockColumns;
    }

    private function supportsReviews(): bool
    {
        if ($this->hasReviewsTable !== null) {
            return $this->hasReviewsTable;
        }

        $this->hasReviewsTable = Schema::hasTable('product_reviews');

        return $this->hasReviewsTable;
    }
}
