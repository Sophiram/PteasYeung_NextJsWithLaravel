<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\ImageStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    /**
     * Get system settings (public/admin).
     */
    public function getSystemSettings(): JsonResponse
    {
        $settings = Setting::firstOrCreate(
            ['id' => 1],
            [
                'system_name' => 'ផ្ទះយើង - Pteas Yeung',
                'logo_url' => '/logo/PteasYeung.png',
                'receipt_logo_url' => '/logo/PteasYeung.png',
                'admin_email' => 'admin@system.com',
                'hero_title' => 'ដែលសក្ដិសមសម្រាប់អ្នក',
                'hero_subtitle' => 'ស្វែងរកបន្ទប់ជួលបានរហ័ស ទាន់ចិត្ត ព័ត៌មានច្បាស់លាស់ និងមានទំនុកចិត្តខ្ពស់។',
                'hero_background' => 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
                'footer_description_kh' => 'ផ្ទះយើង (Pteas Yeung) គឺជាវេទិកាឌីជីថលទំនើបជួយសម្រួលដល់ម្ចាស់ផ្ទះក្នុងការគ្រប់គ្រងអចលនទ្រព្យ បន្ទប់ជួល គណនាវិក្កយបត្រភ្លើង-ទឹក និងចំណូលចំណាយយ៉ាងមានប្រសិទ្ធភាព ព្រមទាំងផ្តល់ភាពងាយស្រួលដល់អ្នកជួលក្នុងការស្វែងរក និងកក់បន្ទប់ប្រកបដោយទំនុកចិត្ត។',
                'footer_description_en' => 'Pteas Yeung is a modern rental property management platform designed to simplify property and room tracking, utility billing, and tenant bookings across Cambodia.',
                'footer_hotline' => '+855 12 345 678',
                'footer_email' => 'support@pteasyeung.com',
                'footer_telegram' => 'https://t.me/pteasyeung_support',
                'footer_address_kh' => 'រាជធានីភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា',
                'footer_address_en' => 'Phnom Penh, Kingdom of Cambodia',
                'footer_operating_hours_kh' => 'ច័ន្ទ - អាទិត្យ (8:00 ព្រឹក - 9:00 យប់)',
                'footer_operating_hours_en' => 'Mon - Sun (8:00 AM - 9:00 PM)',
                'footer_facebook' => 'https://facebook.com',
                'footer_instagram' => 'https://instagram.com',
                'footer_twitter' => 'https://twitter.com',
                'footer_copyright' => 'ផ្ទះយើង (Pteas Yeung) Platform',
                'receipt_title_kh' => 'បង្កាន់ដៃទទួលប្រាក់ / វិក្កយបត្រ',
                'receipt_title_en' => 'OFFICIAL RECEIPT / INVOICE',
                'receipt_subtitle_kh' => 'ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល ផ្ទះយើង',
                'receipt_subtitle_en' => 'Pteas Yeung Rental Platform',
                'receipt_header_note' => 'សូមអរគុណចំពោះការជឿទុកចិត្ត និងស្នាក់នៅជាមួយយើងខ្ញុំ',
                'receipt_footer_note_kh' => 'សូមអរគុណសម្រាប់ការទូទាត់ប្រាក់ទាន់ពេលវេលា!',
                'receipt_footer_note_en' => 'Thank you for your prompt payment!',
                'receipt_terms_kh' => "១. សូមរក្សាទុកបង្កាន់ដៃនេះជាភស្តុតាងនៃការទូទាត់។\n២. ប្រាក់កក់មិនអាចដកវិញបានទេ ប្រសិនបើចាកចេញមុនកាលកំណត់នៃកិច្ចសន្យា។\n៣. ការទូទាត់យឺតយ៉ាវអាចនឹងមានការផាកពិន័យតាមការព្រមព្រៀង។",
                'receipt_terms_en' => "1. Please retain this receipt as proof of payment.\n2. Security deposits are non-refundable in the event of early termination.\n3. Late payments may incur standard agreed penalties.",
                'receipt_currency_symbol' => '$',
                'receipt_khr_exchange_rate' => 4100,
                'receipt_show_water_electricity' => true,
                'receipt_show_signatures' => true,
                'receipt_accent_color' => '#0284c7',
                'admin_bank_name' => 'ABA Bank',
                'admin_bank_account_name' => 'PTEAS YEUNG PLATFORM',
                'admin_bank_account_number' => '001 234 567',
                'admin_bank_qr_url' => null,
                'admin_hotline_secondary' => '+855 98 765 432',
                'admin_payment_notes_kh' => 'សូមផ្ញើវិក្កយបត្រ ឬរូបភាពផ្ទេរប្រាក់មកកាន់ Telegram ផ្លូវការរបស់រដ្ឋបាល ដើម្បីផ្ទៀងផ្ទាត់ និងបើកដំណើរការគណនីភ្លាមៗ។',
                'admin_payment_notes_en' => 'Please send the transfer receipt or screenshot to our official Admin Telegram for instant verification and account activation.',
            ]
        );

        $adminUser = request()->user() ?: \App\Models\User::whereIn('role', ['super_admin', 'admin'])->first();
        $response = $settings->toArray();
        $response['admin_name'] = $adminUser?->name;
        $response['admin_phone'] = $adminUser?->phone;
        $response['admin_profile_picture'] = $adminUser?->profile_picture;

        return response()->json($response);
    }

    /**
     * Update system settings.
     */
    public function updateSystemSettings(Request $request): JsonResponse
    {
        // 1. Sanitize boolean fields, numbers, and empty strings
        if ($request->has('receipt_show_water_electricity')) {
            $val = $request->input('receipt_show_water_electricity');
            $request->merge([
                'receipt_show_water_electricity' => filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            ]);
        }
        if ($request->has('receipt_show_signatures')) {
            $val = $request->input('receipt_show_signatures');
            $request->merge([
                'receipt_show_signatures' => filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            ]);
        }
        if ($request->has('receipt_khr_exchange_rate')) {
            $rate = $request->input('receipt_khr_exchange_rate');
            $request->merge([
                'receipt_khr_exchange_rate' => is_numeric($rate) ? (int) $rate : 4100,
            ]);
        }
        foreach (['footer_email', 'admin_email', 'footer_hotline', 'footer_telegram', 'admin_bank_name', 'admin_bank_account_name', 'admin_bank_account_number'] as $field) {
            if ($request->has($field) && trim((string) $request->input($field)) === '') {
                $request->merge([$field => null]);
            }
        }

        // 2. Build validation rules
        $rules = [
            'system_name' => 'nullable|string|max:255',
            'logo_url' => 'nullable|string',
            'receipt_logo_url' => 'nullable|string',
            'admin_email' => 'nullable|email|max:255',
            'hero_title' => 'nullable|string|max:255',
            'hero_subtitle' => 'nullable|string',
            'hero_background' => 'nullable|string',
            'footer_description_kh' => 'nullable|string',
            'footer_description_en' => 'nullable|string',
            'footer_hotline' => 'nullable|string|max:50',
            'footer_email' => 'nullable|email|max:255',
            'footer_telegram' => 'nullable|string|max:255',
            'footer_address_kh' => 'nullable|string|max:500',
            'footer_address_en' => 'nullable|string|max:500',
            'footer_operating_hours_kh' => 'nullable|string|max:255',
            'footer_operating_hours_en' => 'nullable|string|max:255',
            'footer_facebook' => 'nullable|string|max:255',
            'footer_instagram' => 'nullable|string|max:255',
            'footer_twitter' => 'nullable|string|max:255',
            'footer_copyright' => 'nullable|string|max:255',
            'receipt_title_kh' => 'nullable|string|max:255',
            'receipt_title_en' => 'nullable|string|max:255',
            'receipt_subtitle_kh' => 'nullable|string|max:255',
            'receipt_subtitle_en' => 'nullable|string|max:255',
            'receipt_header_note' => 'nullable|string',
            'receipt_footer_note_kh' => 'nullable|string',
            'receipt_footer_note_en' => 'nullable|string',
            'receipt_terms_kh' => 'nullable|string',
            'receipt_terms_en' => 'nullable|string',
            'receipt_currency_symbol' => 'nullable|string|max:10',
            'receipt_khr_exchange_rate' => 'nullable|integer|min:1',
            'receipt_show_water_electricity' => 'nullable|boolean',
            'receipt_show_signatures' => 'nullable|boolean',
            'receipt_accent_color' => 'nullable|string|max:20',
            'admin_bank_name' => 'nullable|string|max:100',
            'admin_bank_account_name' => 'nullable|string|max:255',
            'admin_bank_account_number' => 'nullable|string|max:100',
            'admin_bank_qr_url' => 'nullable|string',
            'admin_hotline_secondary' => 'nullable|string|max:50',
            'admin_payment_notes_kh' => 'nullable|string',
            'admin_payment_notes_en' => 'nullable|string',
            'admin_name' => 'nullable|string|max:255',
            'admin_phone' => 'nullable|string|max:50',
            'admin_profile_picture' => 'nullable',
            'admin_bank_qr' => 'nullable',
            'logo' => 'nullable',
            'receipt_logo' => 'nullable',
        ];

        if ($request->hasFile('logo')) {
            $rules['logo'] = 'image|mimes:jpeg,png,jpg,gif,webp,svg|max:2048';
        }
        if ($request->hasFile('receipt_logo')) {
            $rules['receipt_logo'] = 'image|mimes:jpeg,png,jpg,gif,webp,svg|max:2048';
        }
        if ($request->hasFile('admin_bank_qr')) {
            $rules['admin_bank_qr'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:2048';
        }
        if ($request->hasFile('admin_profile_picture')) {
            $rules['admin_profile_picture'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:2048';
        }

        $validated = $request->validate($rules);

        $settings = Setting::firstOrCreate(['id' => 1]);

        $dataToUpdate = $validated;
        unset(
            $dataToUpdate['id'],
            $dataToUpdate['created_at'],
            $dataToUpdate['updated_at'],
            $dataToUpdate['logo'],
            $dataToUpdate['receipt_logo'],
            $dataToUpdate['admin_bank_qr'],
            $dataToUpdate['admin_profile_picture'],
            $dataToUpdate['admin_name'],
            $dataToUpdate['admin_phone']
        );

        // If a new main logo file was uploaded
        if ($request->hasFile('logo')) {
            if (!empty($settings->logo_url) && !str_starts_with($settings->logo_url, '/logo/')) {
                ImageStorageService::delete($settings->logo_url);
            }
            $dataToUpdate['logo_url'] = ImageStorageService::upload($request->file('logo'), 'brand');
        }

        // If a new receipt logo file was uploaded
        if ($request->hasFile('receipt_logo')) {
            if (!empty($settings->receipt_logo_url) && !str_starts_with($settings->receipt_logo_url, '/logo/')) {
                ImageStorageService::delete($settings->receipt_logo_url);
            }
            $dataToUpdate['receipt_logo_url'] = ImageStorageService::upload($request->file('receipt_logo'), 'receipts');
        }

        // If a new admin payment QR code file was uploaded
        if ($request->hasFile('admin_bank_qr')) {
            if (!empty($settings->admin_bank_qr_url) && !str_starts_with($settings->admin_bank_qr_url, '/logo/')) {
                ImageStorageService::delete($settings->admin_bank_qr_url);
            }
            $dataToUpdate['admin_bank_qr_url'] = ImageStorageService::upload($request->file('admin_bank_qr'), 'brand');
        }

        // If admin profile picture was uploaded
        if ($request->hasFile('admin_profile_picture') && $request->user()) {
            if ($request->user()->profile_picture) {
                ImageStorageService::delete($request->user()->profile_picture);
            }
            $request->user()->update([
                'profile_picture' => ImageStorageService::upload($request->file('admin_profile_picture'), 'profiles')
            ]);
        }

        // If admin name or phone updated
        if ($request->user()) {
            $userFields = [];
            if ($request->filled('admin_name')) $userFields['name'] = $request->input('admin_name');
            if ($request->filled('admin_phone')) $userFields['phone'] = $request->input('admin_phone');
            if (!empty($userFields)) {
                $request->user()->update($userFields);
            }
        }

        $oldSettings = $settings->only(array_keys($dataToUpdate));
        $settings->update($dataToUpdate);

        // 🛡️ Audit Log
        if ($request->user()) {
            \App\Services\AuditLogger::settingsUpdated($request->user(), $oldSettings, $dataToUpdate);
        }

        $adminUser = $request->user() ?: \App\Models\User::whereIn('role', ['super_admin', 'admin'])->first();
        $response = $settings->fresh()->toArray();
        $response['admin_name'] = $adminUser?->name;
        $response['admin_phone'] = $adminUser?->phone;
        $response['admin_profile_picture'] = $adminUser?->profile_picture;

        return response()->json([
            'message' => 'រក្សាទុកការកំណត់ប្រព័ន្ធ និងទម្រង់ជោគជ័យ!',
            'data' => $response,
        ]);
    }
}
