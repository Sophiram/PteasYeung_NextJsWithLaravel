<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * ១. បង្ហាញបញ្ជីអចលនទ្រព្យទាំងអស់នៅក្នុងប្រព័ន្ធ (ភ្ញៀវទូទៅមើល)
     */
    public function index(Request $request)
    {
        try {
            // ទាញយកផ្ទះទាំងអស់ + ចំនួនបន្ទប់ ដោយមិនខ្វល់ថាជារបស់ Owner ណាឡើយ
            $properties = Property::withCount('rooms')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $properties
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'មិនអាចទាញយកទិន្នន័យបានទេ៖ ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ២. បង្ហាញព័ត៌មានលម្អិតនៃអចលនទ្រព្យមួយ (ភ្ញៀវទូទៅមើល)
     */
    public function show($id)
    {
        try {
            // រកមើលអចលនទ្រព្យ (មិនបាច់ឆែក owner_id ឡើយ ព្រោះជា Public)
            $property = Property::withCount('rooms')->find($id);

            if (!$property) {
                return response()->json([
                    'success' => false,
                    'message' => 'រកមិនឃើញអចលនទ្រព្យនេះឡើយ'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $property
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'មានបញ្ហាប្រព័ន្ធ៖ ' . $e->getMessage()
            ], 500);
        }
    }
}
