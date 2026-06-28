<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
   protected $fillable = [
        'owner_id',
        'title',
        'amount',
        'description',
        'date'
    ];
}
