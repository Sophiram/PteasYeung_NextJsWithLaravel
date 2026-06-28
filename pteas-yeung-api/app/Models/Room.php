<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
   protected $fillable = [
        'property_id', 'room_number', 'price', 'type', 'status', 'floor', 'amenities', 'description', 'image'
    ];

    protected $casts = [
        'amenities' => 'array', // សម្រាប់បំប្លែង JSON ទៅជា Array ស្វ័យប្រវត្តិ
    ];

    public function property() {
        return $this->belongsTo(Property::class, 'property_id');
    }
}
