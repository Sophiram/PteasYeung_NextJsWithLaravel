<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

class AdminSettingController extends Controller
{
    // 🟢 GET: /api/admin/settings (ទាញយកការកំណត់មកបង្ហាញ)
   // 🟢 GET: /api/admin/settings
public function getSystemSettings()
{
    $settings = Setting::firstOrCreate(
        ['id' => 1],
        [
            'system_name'     => 'ផ្ទះយើង - Pteas Yeung',
            'admin_email'     => 'admin@system.com',
            'hero_title'      => 'ដែលសក្ដិសមសម្រាប់អ្នក', // 👈 តម្លៃលំនាំដើម
            'hero_subtitle'   => 'ស្វែងរកបន្ទប់ជួលបានរហ័ស ទាន់ចិត្ត ព័ត៌មានច្បាស់លាស់ និងមានទំនុកចិត្តខ្ពស់។', // 👈 តម្លៃលំនាំដើម
            'hero_background' => 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80' // 👈 រូបភាពលំនាំដើម
        ]
    );
    return response()->json($settings);
}

// 🟢 PUT: /api/admin/settings
public function updateSystemSettings(Request $request)
{
    $validated = $request->validate([
        'system_name'     => 'required|string|max:255',
        'admin_email'     => 'required|email|max:255',
        'hero_title'      => 'nullable|string|max:255', // 👈 ផ្ទៀងផ្ទាត់ទិន្នន័យថ្មី
        'hero_subtitle'   => 'nullable|string',
        'hero_background' => 'nullable|string', // (បងអាចដាក់ជា URL សិន ឬធ្វើ Form Upload រូបភាពតាមក្រោយ)
    ]);

    $settings = Setting::firstOrCreate(['id' => 1]);
    $settings->update($validated);

    return response()->json([
        'message' => 'រក្សាទុកការកំណត់ប្រព័ន្ធបានជោគជ័យ!',
        'data'    => $settings
    ], 200);
}
}
