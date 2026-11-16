<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('paper_scores', function (Blueprint $table) {
            $table->json('dynamic_scores')->nullable()->after('writing_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('paper_scores', function (Blueprint $table) {
            $table->dropColumn('dynamic_scores');
        });
    }
};
