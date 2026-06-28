<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
        protected $fillable = [
        'owner_id',
        'title',
         'description',
         'address',
         'city',
         'location_map_link'
    ];

    public function rooms() {
         return $this->hasMany(Room::class, 'property_id');
     }
    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
}
