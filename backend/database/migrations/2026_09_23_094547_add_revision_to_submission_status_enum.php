<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement("ALTER TABLE papers MODIFY COLUMN submission_status ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVIEWED', 'REVISION', 'ACCEPTED', 'REJECTED', 'PUBLISHED') DEFAULT 'DRAFT'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE papers MODIFY COLUMN submission_status ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'PUBLISHED') DEFAULT 'DRAFT'");
    }
};
