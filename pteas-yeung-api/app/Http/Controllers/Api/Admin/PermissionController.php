<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * List all system permissions grouped by feature group.
     */
    public function index(): JsonResponse
    {
        $permissions = Permission::all();
        $grouped = $permissions->groupBy('group');

        return response()->json([
            'success' => true,
            'permissions' => $permissions,
            'grouped' => $grouped,
        ]);
    }

    /**
     * Get a specific user's permissions (direct, role defaults, and combined effective).
     */
    public function getUserPermissions(int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $directPermissions = $user->permissions()->pluck('slug')->toArray();
        $allEffectivePermissions = $user->getAllPermissions();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'direct_permissions' => $directPermissions,
            'effective_permissions' => $allEffectivePermissions,
        ]);
    }

    /**
     * Update/override custom direct permissions for a user.
     */
    public function updateUserPermissions(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,slug',
        ]);

        $user = User::findOrFail($userId);
        $admin = $request->user();

        $oldPermissions = $user->permissions()->pluck('slug')->toArray();
        $newPermissions = $request->permissions;

        $user->syncPermissions($newPermissions);

        // 🛡️ Audit log the permission update
        AuditLogger::log(
            event: 'user.permissions_updated',
            category: 'user_management',
            description: "Admin {$admin->name} updated custom permissions for user {$user->name} ({$user->email}).",
            severity: 'warning',
            newValues: ['permissions' => $newPermissions],
            oldValues: ['permissions' => $oldPermissions],
            user: $admin,
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'User permissions updated successfully',
            'direct_permissions' => $newPermissions,
            'effective_permissions' => $user->getAllPermissions(),
        ]);
    }
}
