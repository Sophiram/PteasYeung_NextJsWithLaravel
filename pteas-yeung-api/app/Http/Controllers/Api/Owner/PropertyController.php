<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Services\ImageStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PropertyController extends Controller
{
    /**
     * Display a listing of properties owned by the authenticated owner.
     */
    public function index(Request $request): JsonResponse
    {
        $properties = Property::where('owner_id', Auth::id())
            ->with(['images'])
            ->withCount('rooms')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $properties,
        ]);
    }

    /**
     * Store a newly created property.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'description' => 'nullable|string',
            'location_map_link' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        $property = Property::create([
            'owner_id' => Auth::id(),
            'title' => $validated['title'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'description' => $validated['description'] ?? null,
            'location_map_link' => $validated['location_map_link'] ?? null,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $imageUrl = ImageStorageService::upload($image, 'properties');
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $imageUrl,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'បានបង្កើតអចលនទ្រព្យដោយជោគជ័យ',
            'data' => $property->load(['images', 'rooms']),
        ], 201);
    }

    /**
     * Display the specified property.
     */
    public function show($id): JsonResponse
    {
        $property = Property::where('id', $id)
            ->where('owner_id', Auth::id())
            ->with(['images', 'rooms'])
            ->withCount('rooms')
            ->first();

        if (! $property) {
            return response()->json([
                'success' => false,
                'message' => 'រកមិនឃើញអចលនទ្រព្យនេះ ឬអ្នកគ្មានសិទ្ធិមើលឡើយ',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $property,
        ]);
    }

    /**
     * Update the specified property.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $property = Property::where('id', $id)
            ->where('owner_id', Auth::id())
            ->first();

        if (! $property) {
            return response()->json([
                'success' => false,
                'message' => 'រកមិនឃើញទិន្នន័យដើម្បីកែប្រែឡើយ',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location_map_link' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        $property->update(collect($validated)->except('images')->toArray());

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $imageUrl = ImageStorageService::upload($image, 'properties');
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $imageUrl,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'បានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ',
            'data' => $property->load(['images', 'rooms']),
        ]);
    }

    /**
     * Remove the specified property and its images from storage.
     */
    public function destroy($id): JsonResponse
    {
        $property = Property::where('id', $id)
            ->where('owner_id', Auth::id())
            ->first();

        if (! $property) {
            return response()->json([
                'success' => false,
                'message' => 'មិនអាចលុបបានទេ ព្រោះរកមិនឃើញអចលនទ្រព្យនេះឡើយ',
            ], 404);
        }

        foreach ($property->images as $img) {
            ImageStorageService::delete($img->image_path);
        }

        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'បានលុបអចលនទ្រព្យចេញពីប្រព័ន្ធដោយជោគជ័យ',
        ]);
    }
}
