<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'system_name',
        'admin_email',
        'hero_title',
        'hero_subtitle',
        'hero_background',
    ];
}
