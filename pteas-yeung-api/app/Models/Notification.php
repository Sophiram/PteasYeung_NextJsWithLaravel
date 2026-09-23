<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'role',
        'title',
        'message',
        'type',
        'link',
        'is_read',
        'data',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'data' => 'array',
    ];

    /**
     * Notification recipient user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope query to notifications relevant to a specific user.
     */
    public function scopeForUser($query, User $user)
    {
        $role = strtolower($user->role);
        $roleList = [$role, 'all'];

        if ($role === 'super_admin' || $role === 'admin') {
            $roleList = array_merge($roleList, ['super_admin', 'admin']);
        }

        return $query->where(function ($q) use ($user, $roleList) {
            $q->where('user_id', $user->id)
              ->orWhere(function ($sub) use ($roleList) {
                  $sub->whereNull('user_id')
                      ->whereIn('role', $roleList);
              });
        });
    }

    /**
     * Helper to send notification to a specific user.
     */
    public static function sendToUser(int $userId, string $title, string $message, string $type = 'system', ?string $link = null, ?array $data = null): self
    {
        return self::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
            'is_read' => false,
            'data' => $data,
        ]);
    }

    /**
     * Helper to send notification to an entire role group.
     */
    public static function sendToRole(string $role, string $title, string $message, string $type = 'system', ?string $link = null, ?array $data = null): self
    {
        return self::create([
            'role' => $role,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
            'is_read' => false,
            'data' => $data,
        ]);
    }
}
