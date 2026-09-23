<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'group',
        'description',
    ];

    /**
     * Users who have this specific permission assigned directly.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'permission_user');
    }
}
