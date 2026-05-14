<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private readonly CartService $cartService,
    ) {
    }

    public function checkout(User $user, array $payload): Order
    {
        $normalizedItems = $this->cartService->buildNormalizedItems($payload['items']);
        $subtotal = $normalizedItems->sum('line_total');
        $shippingFee = $this->cartService->resolveShippingFee((string) $payload['city']);
        $total = $subtotal + $shippingFee;

        return DB::transaction(function () use ($user, $payload, $normalizedItems, $subtotal, $shippingFee, $total) {
            $order = Order::query()->create([
                'user_id' => $user->id,
                'order_number' => 'SIR-'.strtoupper(Str::random(8)),
                'status' => Order::STATUS_PENDING,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total' => $total,
                'customer_name' => $payload['customer_name'],
                'customer_email' => $payload['customer_email'],
                'phone' => $payload['phone'],
                'address_line' => $payload['address_line'],
                'city' => $payload['city'],
                'payment_method' => $payload['payment_method'],
                'notes' => $payload['notes'] ?? null,
            ]);

            $order->items()->createMany(
                $normalizedItems->map(function (array $entry) {
                    $product = $entry['product'];
                    $product->decrement('stock_quantity', $entry['quantity']);

                    return [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_slug' => $product->slug,
                        'size' => $entry['size'],
                        'unit_price' => $entry['unit_price'],
                        'quantity' => $entry['quantity'],
                        'line_total' => $entry['line_total'],
                        'image' => $product->image,
                    ];
                })->all()
            );

            return $order->load('items');
        });
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $order->status = $this->normalizeStatus($status);

        if ($order->status === Order::STATUS_DELIVERED && ! $order->paid_at) {
            $order->paid_at = now();
        }

        $order->save();

        return $order->fresh('items');
    }

    public function normalizeStatus(string $status): string
    {
        return match ($status) {
            'processing' => Order::STATUS_CONFIRMED,
            'completed' => Order::STATUS_DELIVERED,
            default => $status,
        };
    }
}
