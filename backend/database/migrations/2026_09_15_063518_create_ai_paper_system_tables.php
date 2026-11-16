<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {


        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('papers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('title')->default('Untitled Paper');
            $table->text('abstract')->nullable();
            $table->integer('publication_year')->nullable();
            $table->string('journal')->nullable();
            $table->string('doi')->nullable();
            $table->string('file_path');
            $table->enum('status', ['UPLOADED', 'PROCESSING', 'ANALYZED', 'FAILED', 'ARCHIVED'])->default('UPLOADED');
            $table->boolean('is_submission')->default(false);
            $table->timestamps();
        });

        Schema::create('paper_authors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('paper_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->string('section_name');
            $table->boolean('is_found')->default(true);
            $table->text('summary')->nullable();
            $table->timestamps();
        });

        Schema::create('paper_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->string('research_domain');
            $table->string('research_type');
            $table->json('key_findings')->nullable();
            $table->json('strengths')->nullable();
            $table->json('weaknesses')->nullable();
            $table->json('keywords')->nullable();
            $table->timestamps();
        });

        Schema::create('paper_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->integer('overall_score');
            $table->integer('methodology_score');
            $table->text('methodology_reason');
            $table->integer('novelty_score');
            $table->text('novelty_reason');
            $table->integer('clarity_score');
            $table->text('clarity_reason');
            $table->integer('evidence_score');
            $table->text('evidence_reason');
            $table->integer('reproducibility_score');
            $table->text('reproducibility_reason');
            $table->integer('writing_score');
            $table->text('writing_reason');
            $table->timestamps();
        });

        Schema::create('paper_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->enum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
            $table->string('category');
            $table->string('finding');
            $table->text('explanation');
            $table->text('evidence');
            $table->timestamps();
        });

        Schema::create('paper_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->integer('total_references')->default(0);
            $table->integer('recent_references')->default(0);
            $table->integer('old_references')->default(0);
            $table->json('potential_issues')->nullable();
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->foreignId('reviewer_id')->constrained('users')->onDelete('cascade');
            $table->enum('recommendation', ['ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT'])->nullable();
            $table->integer('score')->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();
        });

        Schema::create('review_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('reviews')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('comment');
            $table->timestamps();
        });

        Schema::create('ai_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paper_id')->constrained('papers')->onDelete('cascade');
            $table->enum('status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])->default('PENDING');
            $table->integer('retry_count')->default(0);
            $table->integer('duration_seconds')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_job_id')->constrained('ai_jobs')->onDelete('cascade');
            $table->string('endpoint');
            $table->longText('payload');
            $table->timestamps();
        });

        Schema::create('ai_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_request_id')->constrained('ai_requests')->onDelete('cascade');
            $table->integer('status_code');
            $table->longText('raw_response');
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action');
            $table->foreignId('paper_id')->nullable()->constrained('papers')->onDelete('set null');
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('ai_responses');
        Schema::dropIfExists('ai_requests');
        Schema::dropIfExists('ai_jobs');
        Schema::dropIfExists('review_comments');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('paper_references');
        Schema::dropIfExists('paper_findings');
        Schema::dropIfExists('paper_scores');
        Schema::dropIfExists('paper_analyses');
        Schema::dropIfExists('paper_sections');
        Schema::dropIfExists('paper_authors');
        Schema::dropIfExists('papers');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
