<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AdminUpdateOrderRequest;
use App\Http\Requests\Api\CheckoutRequest;
use App\Http\Requests\Api\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\ActivityLogService;
use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Support\Facades\Schema;
use Throwable;

class OrderApiController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly CartService $cartService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $order = $this->orderService->checkout($request->user(), $request->validated());

        return response()->json($this->transformOrder($order), 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with('items')
            ->latest()
            ->paginate(12);

        return response()->json([
            'data' => $this->transformOrders($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function myOrderDetails(Request $request, Order $order): JsonResponse
    {
        if ((int) $order->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json($this->transformOrder($order->load('items')));
    }

    public function adminDashboard(): JsonResponse
    {
        $totalRevenue = (float) Order::query()->sum('total');
        $ordersToday = Order::query()->whereDate('created_at', now()->toDateString())->count();

        $recentOrders = Order::query()
            ->latest()
            ->take(8)
            ->get(['id', 'order_number', 'status', 'total', 'customer_name', 'created_at']);

        $salesLast7Days = collect(range(6, 0))->map(function (int $daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();

            return [
                'date' => $date,
                'total' => (float) Order::query()->whereDate('created_at', $date)->sum('total'),
            ];
        })->values();

        return response()->json([
            'stats' => [
                'total_orders' => Order::query()->count(),
                'pending_orders' => Order::query()->where('status', 'pending')->count(),
                'confirmed_orders' => Order::query()->where('status', 'confirmed')->count(),
                'shipped_orders' => Order::query()->where('status', 'shipped')->count(),
                'delivered_orders' => Order::query()->where('status', 'delivered')->count(),
                'orders_today' => $ordersToday,
                'total_revenue' => $totalRevenue,
                'avg_order_value' => (float) (Order::query()->avg('total') ?? 0),
                'total_products' => Product::query()->count(),
                'total_users' => \App\Models\User::query()->count(),
            ],
            'recent_orders' => $recentOrders,
            'sales_last_7_days' => $salesLast7Days,
        ]);
    }

    public function adminOrders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->withCount('items')
            ->when($request->filled('status'), function (Builder $query) use ($request) {
                $query->where('status', (string) $request->string('status'));
            })
            ->when($request->filled('q'), function (Builder $query) use ($request) {
                $term = trim((string) $request->string('q'));
                $query->where(function (Builder $innerQuery) use ($term) {
                    $innerQuery
                        ->where('order_number', 'like', "%{$term}%")
                        ->orWhere('customer_name', 'like', "%{$term}%")
                        ->orWhere('customer_email', 'like', "%{$term}%");
                });
            })
            ->latest()
            ->paginate(min(max((int) $request->integer('per_page', 15), 1), 50));

        return response()->json($orders);
    }

    public function adminUpdateOrderStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $validated = $request->validated();
        $updated = $this->orderService->updateStatus($order, $validated['status']);
        $this->activityLogService->log('admin.order.status_updated', $updated, $request->user(), [
            'status' => $updated->status,
        ]);

        return response()->json($this->transformOrder($updated));
    }

    public function adminUpdateOrder(AdminUpdateOrderRequest $request, Order $order): JsonResponse
    {
        $validated = $request->validated();

        if (array_key_exists('status', $validated)) {
            $validated['status'] = $this->orderService->normalizeStatus((string) $validated['status']);
        }
        $order->fill($validated);

        if (array_key_exists('city', $validated)) {
            $order->shipping_fee = $this->cartService->resolveShippingFee((string) $validated['city']);
            $order->total = (float) $order->subtotal + (float) $order->shipping_fee;
        }

        if (($validated['status'] ?? null) === Order::STATUS_DELIVERED && ! $order->paid_at) {
            $order->paid_at = now();
        }

        $order->save();
        $this->activityLogService->log('admin.order.updated', $order, $request->user());

        return response()->json($this->transformOrder($order->load('items')));
    }

    public function adminDeleteOrder(Request $request, Order $order): JsonResponse
    {
        $order->delete();
        $this->activityLogService->log('admin.order.deleted', $order, $request->user());

        return response()->json(['message' => 'Order deleted.']);
    }

    public function adminUsers(Request $request): JsonResponse
    {
        $users = \App\Models\User::query()
            ->withCount('orders')
            ->when($request->filled('q'), function (Builder $query) use ($request) {
                $term = trim((string) $request->string('q'));
                $query->where(function (Builder $innerQuery) use ($term) {
                    $innerQuery
                        ->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                });
            })
            ->latest()
            ->paginate(min(max((int) $request->integer('per_page', 15), 1), 50));

        return response()->json($users);
    }

    public function adminActivityLogs(Request $request): JsonResponse
    {
        if (! Schema::hasTable('activity_logs')) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => min(max((int) $request->integer('per_page', 20), 1), 100),
                'total' => 0,
            ]);
        }

        try {
            $logs = ActivityLog::query()
                ->with('actor:id,name,email')
                ->when($request->filled('q'), function (Builder $query) use ($request) {
                    $term = trim((string) $request->string('q'));
                    $query->where(function (Builder $innerQuery) use ($term) {
                        $innerQuery
                            ->where('action', 'like', "%{$term}%")
                            ->orWhere('subject_type', 'like', "%{$term}%");
                    });
                })
                ->latest()
                ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

            return response()->json($logs);
        } catch (Throwable) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => min(max((int) $request->integer('per_page', 20), 1), 100),
                'total' => 0,
            ]);
        }
    }

    private function transformOrder(Order $order): array
    {
        return OrderResource::make($order)->resolve();
    }

    private function transformOrders(iterable $orders): array
    {
        $output = [];

        foreach ($orders as $order) {
            $output[] = $this->transformOrder($order);
        }

        return $output;
    }
}
