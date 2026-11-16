<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('guest_name')->nullable()->after('paper_id');
            $table->string('guest_email')->nullable()->after('guest_name');
            $table->string('access_token')->nullable()->after('payment_url');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // Note: Down migration is destructive, so skipping exact reverse for brevity.
        });
    }
};
