<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock_quantity')->default(24)->after('featured');
            $table->boolean('is_popular')->default(false)->after('stock_quantity');
            $table->softDeletes();

            $table->index(['featured', 'stock_quantity']);
            $table->index('is_popular');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['featured', 'stock_quantity']);
            $table->dropIndex(['is_popular']);
            $table->dropColumn(['stock_quantity', 'is_popular']);
            $table->dropSoftDeletes();
        });
    }
};
