<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Get authenticated user profile details.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->loadMissing(['tenantProfile']),
        ]);
    }

    /**
     * Update user profile data and profile picture.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user?->id)],
            'phone' => 'nullable|string|max:20',
            'id_card_number' => 'nullable|string|max:50',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:100',
            'bank_qr_code' => 'nullable',
            'payment_instructions' => 'nullable|string',
        ]);

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture) {
                ImageStorageService::delete($user->profile_picture);
            }

            $validated['profile_picture'] = ImageStorageService::upload($request->file('profile_picture'), 'profiles');
        }

        if ($request->hasFile('bank_qr_code')) {
            if ($user->bank_qr_code) {
                ImageStorageService::delete($user->bank_qr_code);
            }

            $validated['bank_qr_code'] = ImageStorageService::upload($request->file('bank_qr_code'), 'qrcodes');
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'ព័ត៌មានផ្ទាល់ខ្លួនត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Update account password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'new_password.confirmed' => 'ការបញ្ជាក់លេខកូដសម្ងាត់ថ្មីមិនត្រូវគ្នាយើង។',
            'new_password.min' => 'លេខកូដសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ ខ្ទង់។',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'លេខកូដសម្ងាត់ចាស់របស់អ្នកមិនត្រឹមត្រូវឡើយ!',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'លេខកូដសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ!',
        ]);
    }
}
