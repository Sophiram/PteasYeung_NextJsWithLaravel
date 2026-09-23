<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * Display a listing of staff accounts managed by the owner.
     */
    public function index(Request $request): JsonResponse
    {
        $staff = User::where('owner_id', $request->user()->id)
            ->where('role', 'staff')
            ->with('permissions')
            ->latest()
            ->get()
            ->map(function ($member) {
                $data = $member->toArray();
                $data['effective_permissions'] = $member->getAllPermissions();
                return $data;
            });

        return response()->json($staff);
    }

    /**
     * Store a newly created staff account with optional custom permissions.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,slug',
        ]);

        $owner = $request->user();

        $staff = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'staff',
            'status' => 'active',
            'owner_id' => $owner->id,
        ]);

        // Assign custom permissions if provided
        if (! empty($validated['permissions'])) {
            $staff->syncPermissions($validated['permissions']);
        }

        // 🛡️ Audit Log
        AuditLogger::log(
            event: 'staff.created',
            category: 'staff',
            description: "Owner {$owner->name} created staff account for {$staff->name} ({$staff->email}).",
            severity: 'info',
            newValues: ['staff_id' => $staff->id, 'email' => $staff->email, 'permissions' => $validated['permissions'] ?? []],
            user: $owner,
            request: $request
        );

        $staffData = $staff->load('permissions')->toArray();
        $staffData['effective_permissions'] = $staff->getAllPermissions();

        return response()->json([
            'message' => 'Staff created successfully',
            'data' => $staffData,
        ], 201);
    }

    /**
     * Display the specified staff account.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $staff = User::where('id', $id)
            ->where('owner_id', $request->user()->id)
            ->where('role', 'staff')
            ->with('permissions')
            ->firstOrFail();

        $staffData = $staff->toArray();
        $staffData['effective_permissions'] = $staff->getAllPermissions();

        return response()->json($staffData);
    }

    /**
     * Update the specified staff account.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'status' => 'sometimes|required|in:active,inactive',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,slug',
        ]);

        $owner = $request->user();
        $staff = User::where('id', $id)
            ->where('owner_id', $owner->id)
            ->where('role', 'staff')
            ->firstOrFail();

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $permissions = $validated['permissions'] ?? null;
        unset($validated['permissions']);

        $staff->update($validated);

        if ($permissions !== null) {
            $staff->syncPermissions($permissions);
        }

        // 🛡️ Audit Log
        AuditLogger::log(
            event: 'staff.updated',
            category: 'staff',
            description: "Owner {$owner->name} updated staff {$staff->name} ({$staff->email}).",
            severity: 'info',
            newValues: array_merge($validated, ['permissions' => $permissions]),
            user: $owner,
            request: $request
        );

        $staffData = $staff->fresh(['permissions'])->toArray();
        $staffData['effective_permissions'] = $staff->getAllPermissions();

        return response()->json([
            'message' => 'Staff updated successfully',
            'data' => $staffData,
        ]);
    }

    /**
     * Remove the specified staff account.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $owner = $request->user();
        $staff = User::where('id', $id)
            ->where('owner_id', $owner->id)
            ->where('role', 'staff')
            ->firstOrFail();

        // 🛡️ Audit Log
        AuditLogger::log(
            event: 'staff.deleted',
            category: 'staff',
            description: "Owner {$owner->name} deleted staff member {$staff->name} ({$staff->email}).",
            severity: 'danger',
            oldValues: ['id' => $staff->id, 'name' => $staff->name, 'email' => $staff->email],
            user: $owner,
            request: $request
        );

        $staff->delete();

        return response()->json(['message' => 'Staff removed successfully']);
    }

    /**
     * Get assignable permissions for staff and current staff permissions.
     */
    public function getStaffPermissions(Request $request, $id): JsonResponse
    {
        $staff = User::where('id', $id)
            ->where('owner_id', $request->user()->id)
            ->where('role', 'staff')
            ->firstOrFail();

        // Permissions that an owner can delegate to staff
        $staffAllowedGroups = ['properties', 'rooms', 'bookings', 'invoices', 'expenses'];
        $availablePermissions = Permission::whereIn('group', $staffAllowedGroups)->get();

        return response()->json([
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
            ],
            'direct_permissions' => $staff->permissions()->pluck('slug')->toArray(),
            'effective_permissions' => $staff->getAllPermissions(),
            'available_permissions' => $availablePermissions,
            'grouped_available' => $availablePermissions->groupBy('group'),
        ]);
    }

    /**
     * Update permissions for a specific staff member.
     */
    public function updateStaffPermissions(Request $request, $id): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,slug',
        ]);

        $owner = $request->user();
        $staff = User::where('id', $id)
            ->where('owner_id', $owner->id)
            ->where('role', 'staff')
            ->firstOrFail();

        $oldPermissions = $staff->permissions()->pluck('slug')->toArray();
        $staff->syncPermissions($request->permissions);

        // 🛡️ Audit Log
        AuditLogger::log(
            event: 'staff.permissions_updated',
            category: 'staff',
            description: "Owner {$owner->name} updated permissions for staff {$staff->name} ({$staff->email}).",
            severity: 'warning',
            newValues: ['permissions' => $request->permissions],
            oldValues: ['permissions' => $oldPermissions],
            user: $owner,
            request: $request
        );

        return response()->json([
            'message' => 'Staff permissions updated successfully',
            'direct_permissions' => $request->permissions,
            'effective_permissions' => $staff->getAllPermissions(),
        ]);
    }
}
