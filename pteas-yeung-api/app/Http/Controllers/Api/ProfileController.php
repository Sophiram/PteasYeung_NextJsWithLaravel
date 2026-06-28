<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * ១. ទាញយកព័ត៌មានអ្នកប្រើប្រាស់បច្ចុប្បន្ន (Get Profile Details)
     */
    public function show(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ], 200);
    }

    /**
     * ២. ធ្វើបច្ចុប្បន្នភាពព័ត៌មានផ្ទាល់ខ្លួន (Update Profile Data & Picture)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone'           => 'nullable|string|max:20',
            'id_card_number'  => 'nullable|string|max:50',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // ទំហំអតិបរមា 2MB
        ]);

        // គ្រប់គ្រងការ Upload រូបភាព Profile Picture
        if ($request->hasFile('profile_picture')) {
            // លុបរូបភាពចាស់ចេញពី Storage បើមាន
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            // រក្សាទុករូបភាពថ្មីនៅក្នុង folder 'profiles' នៃ public disk
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $validated['profile_picture'] = $path;
        }

        // ធ្វើបច្ចុប្បន្នភាពទិន្នន័យទៅក្នុង Database
        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'ព័ត៌មានផ្ទាល់ខ្លួនត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!',
            'user'    => $user
        ], 200);
    }

    /**
     * ៣. មុខងារផ្លាស់ប្តូរលេខកូដសម្ងាត់ (Update Password)
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed', // តម្រូវឱ្យផ្ញើ new_password_confirmation មកជាមួយ
        ], [
            'new_password.confirmed' => 'ការបញ្ជាក់លេខកូដសម្ងាត់ថ្មីមិនត្រូវគ្នាយើង។',
            'new_password.min' => 'លេខកូដសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ ខ្ទង់។'
        ]);

        $user = $request->user();

        // ផ្ទៀងផ្ទាត់លេខកូដសម្ងាត់ចាស់
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'លេខកូដសម្ងាត់ចាស់របស់អ្នកមិនត្រឹមត្រូវឡើយ!'
            ], 422);
        }

        // រក្សាទុកលេខកូដសម្ងាត់ថ្មី
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'លេខកូដសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ!'
        ], 200);
    }
}
