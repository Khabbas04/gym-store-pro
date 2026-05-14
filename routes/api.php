<?php

use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\EngagementApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\ProductApiController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:api')->group(function () {
Route::get('/products', [ProductApiController::class, 'index']);
Route::get('/products/{product}', [ProductApiController::class, 'show']);
Route::get('/products/{product}/reviews', [EngagementApiController::class, 'reviews']);
Route::get('/homepage/sections', [ProductApiController::class, 'homepage']);

Route::get('/categories', [ProductApiController::class, 'categories']);

Route::post('/auth/register', [AuthApiController::class, 'register']);
Route::post('/auth/login', [AuthApiController::class, 'login']);

Route::middleware(['throttle:120,1', 'auth.token'])->group(function () {
	Route::get('/auth/me', [AuthApiController::class, 'me']);
	Route::post('/auth/logout', [AuthApiController::class, 'logout']);
	Route::post('/checkout', [OrderApiController::class, 'checkout']);
	Route::get('/orders/my', [OrderApiController::class, 'myOrders']);
	Route::get('/orders/my/{order}', [OrderApiController::class, 'myOrderDetails']);
	Route::get('/wishlist', [EngagementApiController::class, 'myWishlist']);
	Route::post('/wishlist/{product}', [EngagementApiController::class, 'toggleWishlist']);
	Route::post('/products/{product}/reviews', [EngagementApiController::class, 'upsertReview']);
	Route::post('/products/{product}/recently-viewed', [EngagementApiController::class, 'markRecentlyViewed']);
	Route::get('/recently-viewed', [EngagementApiController::class, 'myRecentlyViewed']);
});

Route::middleware(['throttle:120,1', 'auth.token', 'admin'])->group(function () {
	Route::post('/products', [ProductApiController::class, 'store']);
	Route::put('/products/{product}', [ProductApiController::class, 'update']);
	Route::patch('/admin/products/{product}/inventory', [ProductApiController::class, 'updateInventory']);
	Route::delete('/products/{product}', [ProductApiController::class, 'destroy']);
	Route::get('/dashboard/summary', [ProductApiController::class, 'summary']);
	Route::get('/admin/dashboard', [OrderApiController::class, 'adminDashboard']);
	Route::get('/admin/orders', [OrderApiController::class, 'adminOrders']);
	Route::put('/admin/orders/{order}/status', [OrderApiController::class, 'adminUpdateOrderStatus']);
	Route::put('/admin/orders/{order}', [OrderApiController::class, 'adminUpdateOrder']);
	Route::delete('/admin/orders/{order}', [OrderApiController::class, 'adminDeleteOrder']);
	Route::get('/admin/users', [OrderApiController::class, 'adminUsers']);
	Route::get('/admin/activity-logs', [OrderApiController::class, 'adminActivityLogs']);
});
});
