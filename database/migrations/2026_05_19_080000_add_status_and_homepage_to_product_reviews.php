<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('product_reviews', 'status')) {
                $table->string('status', 32)->default('pending')->after('comment');
            }
            if (!Schema::hasColumn('product_reviews', 'show_on_homepage')) {
                $table->boolean('show_on_homepage')->default(false)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropColumn(['status', 'show_on_homepage']);
        });
    }
};
