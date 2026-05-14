<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CartService
{
    public function resolveShippingFee(string $city): float
    {
        $normalized = Str::of($city)->trim()->lower()->value();

        return in_array($normalized, ['amman', 'amman governorate', 'عمان'], true) ? 2.0 : 3.0;
    }

    public function buildNormalizedItems(array $items): Collection
    {
        $itemsCollection = collect($items);
        $productIds = $itemsCollection->pluck('product_id')->unique()->values();

        $products = Product::query()
            ->whereIn('id', $productIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($products->count() !== $productIds->count()) {
            abort(response()->json(['message' => 'Some products are unavailable.'], 422));
        }

        return $itemsCollection->map(function (array $item) use ($products) {
            $product = $products->get($item['product_id']);
            $quantity = (int) $item['quantity'];

            if ($product->stock_quantity < $quantity) {
                abort(response()->json([
                    'message' => "Insufficient stock for {$product->name}.",
                ], 422));
            }

            $unitPrice = (float) $product->price;

            return [
                'product' => $product,
                'quantity' => $quantity,
                'size' => $item['size'] ?? null,
                'unit_price' => $unitPrice,
                'line_total' => $unitPrice * $quantity,
            ];
        });
    }
}
