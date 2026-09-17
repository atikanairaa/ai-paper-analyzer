<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiJob extends Model
{
    //
    public function requests() { return $this->hasMany(AiRequest::class); }
    public function paper() { return $this->belongsTo(Paper::class); }
}

