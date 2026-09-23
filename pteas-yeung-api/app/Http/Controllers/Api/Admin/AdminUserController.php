<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * Display a listing of users with optional filtering and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->latest()->get();

        return response()->json($users);
    }

    /**
     * Store a newly created user by Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:super_admin,admin,owner,staff,tenant',
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive,pending',
        ]);

        if ($validated['role'] === 'admin') {
            $validated['role'] = 'super_admin';
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show($id): JsonResponse
    {
        $user = User::with(['properties', 'tenantProfile'])->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update the specified user details.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|required|in:super_admin,admin,owner,staff,tenant',
            'status' => 'sometimes|required|in:active,inactive,pending',
            'password' => 'nullable|string|min:6',
        ]);

        $user = User::findOrFail($id);

        if (isset($validated['role']) && $validated['role'] === 'admin') {
            $validated['role'] = 'super_admin';
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user,
        ]);
    }

    /**
     * Update user account status (active/inactive).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,inactive,pending',
        ]);

        $user = User::findOrFail($id);
        $oldStatus = $user->status;
        $user->status = $request->status;
        $user->save();

        // 🔔 ផ្ញើការជូនដំណឹងទៅកាន់អ្នកប្រើប្រាស់នៅពេល Admin អនុម័តគណនី (Active)
        if ($oldStatus !== 'active' && $request->status === 'active') {
            $redirectUrl = $user->isTenant() ? '/dashboard/tenant' : ($user->isOwner() ? '/dashboard/owner' : '/dashboard/admin');
            Notification::sendToUser(
                $user->id,
                'គណនីត្រូវបានអនុម័តជោគជ័យ (Account Approved)',
                'គណនីរបស់អ្នកត្រូវបានរដ្ឋបាលអនុម័ត និងផ្ទៀងផ្ទាត់រួចរាល់ហើយ។ អ្នកអាចចាប់ផ្តើមប្រើប្រាស់ប្រព័ន្ធបានពេញលេញ!',
                'success',
                $redirectUrl,
                ['user_id' => $user->id, 'status' => 'active']
            );
        }

        // 🛡️ កត់ត្រា Audit Log
        if ($request->user()) {
            \App\Services\AuditLogger::userStatusChanged($request->user(), $user, $oldStatus, $request->status);
        }

        return response()->json([
            'message' => 'Status updated successfully',
            'status' => $user->status,
        ]);
    }

    /**
     * Change user role.
     */
    public function changeRole(Request $request, $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|in:owner,staff,tenant,super_admin,admin',
        ]);

        $role = $request->role === 'admin' ? 'super_admin' : $request->role;

        $user = User::findOrFail($id);
        $oldRole = $user->role;
        $user->role = $role;
        $user->save();

        // 🛡️ កត់ត្រា Audit Log
        if ($request->user()) {
            \App\Services\AuditLogger::userRoleChanged($request->user(), $user, $oldRole, $role);
        }

        return response()->json([
            'message' => 'Role updated to '.$role,
            'role' => $role,
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        // 🛡️ កត់ត្រា Audit Log មុនលុប
        if ($admin) {
            \App\Services\AuditLogger::log(
                event: 'user.deleted',
                category: 'user_management',
                description: "Admin {$admin->name} deleted user {$user->name} ({$user->email}, role: {$user->role}).",
                severity: 'danger',
                oldValues: ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
                user: $admin,
                request: $request
            );
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
