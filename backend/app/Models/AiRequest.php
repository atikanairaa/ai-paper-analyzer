<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiRequest extends Model
{
    //
    public function responses() { return $this->hasMany(AiResponse::class); }
}

