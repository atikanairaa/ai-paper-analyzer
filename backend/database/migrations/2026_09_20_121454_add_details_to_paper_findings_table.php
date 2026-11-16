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
        Schema::table('paper_findings', function (Blueprint $table) {
            $table->string('page')->nullable()->after('explanation');
            $table->string('section')->nullable()->after('page');
            $table->float('confidence')->nullable()->after('section');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('paper_findings', function (Blueprint $table) {
            $table->dropColumn(['page', 'section', 'confidence']);
        });
    }
};
