<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Requests\Api\UpdateProductInventoryRequest;
use App\Http\Requests\Api\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ActivityLogService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ProductApiController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->productService->getPaginatedProducts($request);

        return response()->json([
            'data' => $this->transformProducts($paginated->items()),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        $hasReviews = Schema::hasTable('product_reviews');
        $hasOrderItems = Schema::hasTable('order_items');

        if ($hasReviews) {
            $product->load([
                'reviews' => fn ($query) => $query->with('user')->latest()->take(12),
            ])->loadCount('reviews')->loadAvg('reviews', 'rating');
        }

        $customersAlsoBought = collect();
        if ($hasOrderItems) {
            $alsoBoughtIds = $product->orderItems()
                ->whereNotNull('order_id')
                ->pluck('order_id')
                ->take(50);

            $customersAlsoBought = Product::query()
                ->where('id', '!=', $product->id)
                ->whereHas('orderItems', fn ($query) => $query->whereIn('order_id', $alsoBoughtIds))
                ->latest()
                ->take(6)
                ->get();
        }

        return response()->json([
            ...ProductResource::make($product)->resolve(),
            'related_products' => $this->transformProducts($this->productService->getRelated($product)),
            'customers_also_bought' => $this->transformProducts($customersAlsoBought),
            'reviews' => $hasReviews
                ? \App\Http\Resources\ReviewResource::collection($product->reviews)->resolve()
                : [],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());
        $this->productService->clearCaches();
        $this->activityLogService->log('admin.product.created', $product, $request->user());

        return response()->json(ProductResource::make($product), 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $updated = $this->productService->update($product, $request->validated());
        $this->productService->clearCaches();
        $this->activityLogService->log('admin.product.updated', $updated, $request->user());

        return response()->json(ProductResource::make($updated));
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $product->delete();
        $this->productService->clearCaches();
        $this->activityLogService->log('admin.product.deleted', $product, $request->user());

        return response()->json(status: 204);
    }

    public function updateInventory(UpdateProductInventoryRequest $request, Product $product): JsonResponse
    {
        $validated = $request->validated();

        if (Schema::hasColumn('products', 'stock_quantity')) {
            $product->stock_quantity = (int) $validated['stock_quantity'];
        }

        if (array_key_exists('is_popular', $validated) && Schema::hasColumn('products', 'is_popular')) {
            $product->is_popular = (bool) $validated['is_popular'];
        }

        $product->save();
        $this->productService->clearCaches();
        $this->activityLogService->log('admin.product.inventory_updated', $product, $request->user(), [
            'stock_quantity' => $product->stock_quantity,
            'is_popular' => $product->is_popular,
        ]);

        return response()->json(ProductResource::make($product->fresh())->resolve());
    }

    public function categories(): JsonResponse
    {
        return response()->json($this->productService->getCategories());
    }

    public function homepage(): JsonResponse
    {
        $sections = $this->productService->getHomepageSections();

        return response()->json([
            'featured' => $this->transformProducts($sections['featured']),
            'popular' => $this->transformProducts($sections['popular']),
        ]);
    }

    public function summary(): JsonResponse
    {
        $totalProducts = Product::query()->count();

        return response()->json([
            'total_products' => $totalProducts,
            'featured_products' => Product::query()->where('featured', true)->count(),
            'total_categories' => Product::query()->distinct('category')->count('category'),
            'avg_price' => Product::query()->avg('price') ?? 0,
            'low_stock_products' => Schema::hasColumn('products', 'stock_quantity')
                ? Product::query()->where('stock_quantity', '<=', 5)->count()
                : 0,
        ]);
    }

    private function transformProducts(iterable $products): array
    {
        $output = [];

        foreach ($products as $product) {
            $output[] = ProductResource::make($product)->resolve();
        }

        return $output;
    }
}
