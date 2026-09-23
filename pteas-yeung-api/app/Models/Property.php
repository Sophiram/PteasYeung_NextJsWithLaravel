<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'title',
        'description',
        'address',
        'city',
        'location_map_link',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'property_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class, 'property_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'property_id');
    }

    /**
     * All bookings across rooms in this property.
     */
    public function bookings(): HasManyThrough
    {
        return $this->hasManyThrough(
            Booking::class,
            Room::class,
            'property_id', // Foreign key on rooms table
            'room_id',     // Foreign key on bookings table
            'id',          // Local key on properties table
            'id'           // Local key on rooms table
        );
    }

    /**
     * Scope query to properties of a given owner.
     */
    public function scopeForOwner(Builder $query, int $ownerId): Builder
    {
        return $query->where('owner_id', $ownerId);
    }

    /**
     * Scope query to properties in a given city.
     */
    public function scopeInCity(Builder $query, string $city): Builder
    {
        return $query->where('city', $city);
    }
}
