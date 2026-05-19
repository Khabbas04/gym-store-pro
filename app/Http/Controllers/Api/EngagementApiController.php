<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreReviewRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\RecentlyViewedProduct;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class EngagementApiController extends Controller
{
    public function myWishlist(Request $request): JsonResponse
    {
        if (! Schema::hasTable('wishlists')) {
            return response()->json([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 12, 'total' => 0],
            ]);
        }

        $items = $request->user()
            ->wishlistProducts()
            ->latest('wishlists.created_at')
            ->paginate(12);

        if (Schema::hasTable('product_reviews')) {
            $items->getCollection()->loadAvg('reviews', 'rating')->loadCount('reviews');
        }

        return response()->json([
            'data' => ProductResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function toggleWishlist(Request $request, Product $product): JsonResponse
    {
        if (! Schema::hasTable('wishlists')) {
            return response()->json(['wishlisted' => false]);
        }

        $user = $request->user();

        $exists = Wishlist::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($exists) {
            Wishlist::query()
                ->where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->delete();
        } else {
            Wishlist::query()->create([
                'user_id' => $user->id,
                'product_id' => $product->id,
            ]);
        }

        return response()->json([
            'wishlisted' => ! $exists,
        ]);
    }

    public function reviews(Product $product): JsonResponse
    {
        if (! Schema::hasTable('product_reviews')) {
            return response()->json([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 10, 'total' => 0],
            ]);
        }

        $reviews = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('status', 'approved')
            ->with('user')
            ->latest()
            ->paginate(10);

        return response()->json([
            'data' => ReviewResource::collection($reviews->items()),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function homepageReviews(Request $request): JsonResponse
    {
        if (! Schema::hasTable('product_reviews')) {
            return response()->json([]);
        }

        $reviews = ProductReview::query()
            ->where('status', 'approved')
            ->where('show_on_homepage', true)
            ->with(['user', 'product'])
            ->latest()
            ->take(6)
            ->get();

        return response()->json(ReviewResource::collection($reviews));
    }

    public function upsertReview(StoreReviewRequest $request, Product $product): JsonResponse
    {
        if (! Schema::hasTable('product_reviews')) {
            return response()->json(['message' => 'Reviews are unavailable right now.'], 200);
        }

        // Validate that user has purchased the product (completed order / exists in order_items)
        $hasOrdered = \App\Models\Order::query()
            ->where('user_id', $request->user()->id)
            ->whereHas('items', function ($query) use ($product) {
                $query->where('product_id', $product->id);
            })
            ->exists();

        if (!$hasOrdered) {
            return response()->json(['message' => 'You can only review products you have purchased.'], 403);
        }

        $review = ProductReview::query()->updateOrCreate(
            [
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
            ],
            array_merge($request->validated(), ['status' => 'pending'])
        );

        return response()->json(ReviewResource::make($review->load('user')));
    }

    public function markRecentlyViewed(Request $request, Product $product): JsonResponse
    {
        if (! Schema::hasTable('recently_viewed_products')) {
            return response()->json(['ok' => true]);
        }

        RecentlyViewedProduct::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'product_id' => $product->id,
            ],
            [
                'updated_at' => now(),
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function myRecentlyViewed(Request $request): JsonResponse
    {
        if (! Schema::hasTable('recently_viewed_products')) {
            return response()->json([]);
        }

        $products = $request->user()
            ->recentlyViewedProducts()
            ->take(12)
            ->get();

        if (Schema::hasTable('product_reviews')) {
            $products->loadAvg('reviews', 'rating')->loadCount('reviews');
        }

        return response()->json(ProductResource::collection($products));
    }

    public function adminReviews(Request $request): JsonResponse
    {
        if (! Schema::hasTable('product_reviews')) {
            return response()->json([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0],
            ]);
        }

        $reviews = ProductReview::query()
            ->with(['user', 'product'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => ReviewResource::collection($reviews->items())->load('product'),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function adminUpdateReviewStatus(Request $request, ProductReview $review): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,approved,rejected',
        ]);

        $review->update(['status' => $validated['status']]);

        return response()->json(ReviewResource::make($review->load(['user', 'product'])));
    }

    public function adminToggleReviewHomepage(Request $request, ProductReview $review): JsonResponse
    {
        $review->update(['show_on_homepage' => !$review->show_on_homepage]);

        return response()->json(ReviewResource::make($review->load(['user', 'product'])));
    }

    public function adminDeleteReview(ProductReview $review): JsonResponse
    {
        $review->delete();

        return response()->json(null, 204);
    }
}
