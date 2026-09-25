<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paper extends Model
{
    //
    protected $fillable = [
        'uploaded_by',
        'title',
        'abstract',
        'publication_year',
        'journal',
        'doi',
        'file_path',
        'status',
        'is_submission',
        'submission_status'
    ];
    public function authors()
    {
        return $this->hasMany(PaperAuthor::class);
    }
    public function analyses()
    {
        return $this->hasMany(PaperAnalysis::class);
    }
    public function scores()
    {
        return $this->hasOne(PaperScore::class);
    }
    public function findings()
    {
        return $this->hasMany(PaperFinding::class);
    }
    public function latestJob()
    {
        return $this->hasOne(AiJob::class)->latestOfMany();
    }

    public function aiJobs()
    {
        return $this->hasMany(AiJob::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function sections()
    {
        return $this->hasMany(PaperSection::class);
    }

    public function references()
    {
        return $this->hasOne(PaperReference::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
