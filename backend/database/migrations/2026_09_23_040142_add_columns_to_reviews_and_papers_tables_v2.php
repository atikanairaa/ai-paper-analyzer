<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('reviews', 'recommendation_reason')) {
                $table->text('recommendation_reason')->nullable()->after('comments');
            }
            if (!Schema::hasColumn('reviews', 'report_data')) {
                $table->json('report_data')->nullable()->after('recommendation_reason');
            }
        });

        Schema::table('papers', function (Blueprint $table) {
            if (!Schema::hasColumn('papers', 'payment_status')) {
                $table->enum('payment_status', ['UNPAID', 'PAID'])->default('UNPAID')->after('submission_status');
            }
        });
        
        // MODIFY COLUMN hanya didukung MySQL/MariaDB, skip untuk SQLite
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE papers MODIFY COLUMN submission_status ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'PUBLISHED') DEFAULT 'DRAFT'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('papers', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
        
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn('recommendation_reason');
            $table->dropColumn('report_data');
        });
    }
};
