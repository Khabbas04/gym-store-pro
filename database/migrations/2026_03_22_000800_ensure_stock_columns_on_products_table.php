<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'stock_quantity')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unsignedInteger('stock_quantity')->default(24)->after('featured');
            });
        }

        if (! Schema::hasColumn('products', 'is_popular')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('is_popular')->default(false)->after('stock_quantity');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'is_popular')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('is_popular');
            });
        }

        if (Schema::hasColumn('products', 'stock_quantity')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('stock_quantity');
            });
        }
    }
};
