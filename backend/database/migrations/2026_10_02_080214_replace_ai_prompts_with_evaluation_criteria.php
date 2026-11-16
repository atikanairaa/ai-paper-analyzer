<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Buat tabel baru: evaluation_criteria
        Schema::create('evaluation_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('instruction')->nullable();
            $table->integer('weight')->default(20);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_analyze')->default(true);
            $table->boolean('is_review')->default(false);
            $table->boolean('is_qa')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_criteria');


    }
};
