<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PropertyController extends Controller
{
    /**
     * ១. បង្ហាញបញ្ជីអចលនទ្រព្យទាំងអស់របស់ Owner ម្នាក់ៗ + ចំនួនបន្ទប់
     */
    public function index(Request $request)
    {
        try {
            $ownerId = Auth::id();

            $properties = Property::where('owner_id', $ownerId)
                ->withCount('rooms')
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
     * ២. បង្កើតអចលនទ្រព្យថ្មី
     */
    public function store(Request $request)
    {
        try {
            // 🟢 កែតម្រូវឈ្មោះ Fields ឱ្យត្រូវទៅនឹង Model ($fillable)
            $validator = Validator::make($request->all(), [
                'title'             => 'required|string|max:255', // កែពី name -> title
                'address'           => 'required|string',
                'city'              => 'required|string|max:100', // ថែម city
                'description'       => 'nullable|string',
                'location_map_link' => 'nullable|url',            // ថែម link ផែនទី
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['owner_id'] = Auth::id();

            // 💡 ដំណើរការបានជោគជ័យ ព្រោះ fields ត្រូវគ្នាជាមួយ $fillable ក្នុង Model
            $property = Property::create($data);

            return response()->json([
                'success' => true,
                'message' => 'បានបង្កើតអចលនទ្រព្យដោយជោគជ័យ',
                'data' => $property
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ការបង្កើតបានបរាជ័យ៖ ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ៣. បង្ហាញព័ត៌មានលម្អិត
     */
    public function show($id)
    {
        try {
            $property = Property::where('id', $id)
                ->where('owner_id', Auth::id())
                ->withCount('rooms')
                ->first();

            if (!$property) {
                return response()->json([
                    'success' => false,
                    'message' => 'រកមិនឃើញអចលនទ្រព្យនេះ ឬអ្នកគ្មានសិទ្ធិមើលឡើយ'
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

    /**
     * ៤. កែប្រែព័ត៌មានអចលនទ្រព្យ
     */
    public function update(Request $request, $id)
    {
        try {
            $property = Property::where('id', $id)->where('owner_id', Auth::id())->first();

            if (!$property) {
                return response()->json([
                    'success' => false,
                    'message' => 'រកមិនឃើញទិន្នន័យដើម្បីកែប្រែឡើយ'
                ], 404);
            }

            // 🟢 កែតម្រូវឈ្មោះ Fields ត្រង់ចំណុចនេះដូចគ្នា
            $validator = Validator::make($request->all(), [
                'title'             => 'sometimes|required|string|max:255',
                'address'           => 'sometimes|required|string',
                'city'              => 'sometimes|required|string|max:100',
                'description'       => 'nullable|string',
                'location_map_link' => 'nullable|url',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $property->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'បានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ',
                'data' => $property
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ការកែប្រែបានបរាជ័យ៖ ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ៥. លុបអចលនទ្រព្យ
     */
    public function destroy($id)
    {
        try {
            $property = Property::where('id', $id)->where('owner_id', Auth::id())->first();

            if (!$property) {
                return response()->json([
                    'success' => false,
                    'message' => 'មិនអាចលុបបានទេ ព្រោះរកមិនឃើញអចលនទ្រព្យនេះឡើយ'
                ], 404);
            }

            $property->delete();

            return response()->json([
                'success' => true,
                'message' => 'បានលុបអចលនទ្រព្យចេញពីប្រព័ន្ធដោយជោគជ័យ'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ការលុបបានបរាជ័យ៖ ' . $e->getMessage()
            ], 500);
        }
    }
}
