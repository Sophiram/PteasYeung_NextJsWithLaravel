<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Register a new user account (tenant or owner).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:tenant,owner',
            'phone' => 'nullable|string|max:20',
            'id_card_number' => 'nullable|string|max:50',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'id_card_number' => $validated['id_card_number'] ?? null,
            'status' => 'pending',
        ]);

        // 🔔 ផ្ញើការជូនដំណឹងទៅកាន់ Super Admin អំពីការចុះឈ្មោះថ្មី
        Notification::sendToRole(
            'super_admin',
            'ការចុះឈ្មោះអ្នកប្រើប្រាស់ថ្មី (New Registration)',
            "អ្នកប្រើប្រាស់ {$user->name} (តួនាទី: {$user->role}) បានចុះឈ្មោះ និងកំពុងរង់ចាំការអនុម័ត និងទូទាត់ប្រាក់។",
            'warning',
            '/dashboard/admin/users',
            ['user_id' => $user->id, 'role' => $user->role, 'email' => $user->email]
        );

        // 🛡️ កត់ត្រាក្នុង Audit Log
        \App\Services\AuditLogger::authRegister($user, $request);

        return response()->json([
            'message' => 'ការចុះឈ្មោះជោគជ័យ! គណនីរបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យ និងអនុម័តពីរដ្ឋបាល។',
            'status' => 'pending',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'status' => $user->status,
            ],
        ], 201);
    }

    /**
     * Authenticate user credentials and return Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            // 🛡️ កត់ត្រា Failed Login (Security Alert)
            \App\Services\AuditLogger::authFailedLogin($request->email, $request, 'Invalid email or password');

            throw ValidationException::withMessages([
                'email' => ['អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវឡើយ។'],
            ]);
        }

        if ($user->status === 'inactive') {
            \App\Services\AuditLogger::log(
                event: 'auth.login_blocked',
                category: 'auth',
                description: "Login blocked for suspended/inactive user {$user->email}.",
                severity: 'warning',
                newValues: ['status' => 'inactive'],
                user: $user,
                request: $request
            );

            return response()->json([
                'message' => 'គណនីរបស់អ្នកត្រូវបានផ្អាក។ សូមទាក់ទងមកកាន់រដ្ឋបាល!',
            ], 403);
        }

        if ($user->status === 'pending') {
            return response()->json([
                'status' => 'pending',
                'message' => 'គណនីរបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យ និងអនុម័តពីរដ្ឋបាល! សូមបញ្ចប់ការទូទាត់ជាមួយរដ្ឋបាល។',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'status' => $user->status,
                ],
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // 🛡️ កត់ត្រា Successful Login
        \App\Services\AuditLogger::authLogin($user, $request);

        $userData = $user->loadMissing('tenantProfile')->toArray();
        $userData['permissions'] = $user->getAllPermissions();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $userData,
            'permissions' => $user->getAllPermissions(),
        ]);
    }

    /**
     * Get the authenticated user's details.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isTenant()) {
            $user->loadMissing('tenantProfile');
        } elseif ($user->isOwner()) {
            $user->loadCount(['properties', 'staff']);
        } elseif ($user->isStaff()) {
            $user->loadMissing('owner:id,name,email');
        }

        $userData = $user->toArray();
        $userData['permissions'] = $user->getAllPermissions();

        return response()->json([
            'user' => $userData,
            'permissions' => $user->getAllPermissions(),
        ]);
    }

    /**
     * Invalidate the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        // 🛡️ កត់ត្រា Logout
        \App\Services\AuditLogger::authLogout($user, $request);

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse|\Symfony\Component\HttpFoundation\RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle the callback from Google authentication.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        try {
            $driver = Socialite::driver('google')->stateless();
            $guzzleConfig = config('services.google.guzzle', []);
            if (! empty($guzzleConfig)) {
                $driver->setHttpClient(new \GuzzleHttp\Client($guzzleConfig));
            }

            $googleUser = $driver->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if ($user) {
                // Link google_id if not yet linked, keep existing role and password intact!
                if (! $user->google_id) {
                    $user->google_id = $googleUser->getId();
                }
                if (! $user->profile_picture && $googleUser->getAvatar()) {
                    $user->profile_picture = $googleUser->getAvatar();
                }
                $user->save();
            } else {
                $user = User::create([
                    'name' => $googleUser->getName() ?? 'Google User',
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'password' => Hash::make(Str::random(24)),
                    'role' => 'tenant',
                    'status' => 'active',
                    'profile_picture' => $googleUser->getAvatar(),
                ]);
            }

            if ($user->status === 'inactive' || $user->status === 'pending') {
                return redirect($frontendUrl.'/login?error=account_suspended');
            }

            $token = $user->createToken('access_token')->plainTextToken;

            return redirect($frontendUrl.'/auth/callback?token='.$token);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth callback failed: '.$e->getMessage(), [
                'exception' => $e,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return redirect($frontendUrl.'/login?error=google_auth_failed&msg='.urlencode($e->getMessage()));
        }
    }
}
