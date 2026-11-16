<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\Paper;
use App\Models\AiJob;
use App\Jobs\AnalyzePaperJob;

#[Signature('paper:reanalyze {id}')]
#[Description('Mengekstrak ulang dan menganalisis ulang naskah menggunakan AI')]
class ReanalyzePaper extends Command
{
    public function handle()
    {
        $id = $this->argument('id');
        $paper = Paper::find($id);

        if (!$paper) {
            $this->error("Paper dengan ID {$id} tidak ditemukan.");
            return;
        }

        $this->info("Menyiapkan ekstraksi ulang untuk paper: {$paper->title}");

        $jobRecord = AiJob::create([
            'paper_id' => $paper->id,
            'job_type' => 'ANALYSIS',
            'status' => 'PENDING',
        ]);

        AnalyzePaperJob::dispatch($jobRecord->id, $paper->id);

        $this->info("Job ekstraksi AI (Job ID: {$jobRecord->id}) berhasil dimasukkan ke antrean.");
        $this->info("Jalankan 'php artisan queue:work' jika antrean belum berjalan.");
    }
}