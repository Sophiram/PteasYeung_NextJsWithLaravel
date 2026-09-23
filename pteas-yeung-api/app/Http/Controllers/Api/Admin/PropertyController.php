<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * Display a listing of all properties with room counts and owner info.
     */
    public function index(): JsonResponse
    {
        $properties = Property::withCount('rooms')
            ->with(['owner:id,name,email', 'images'])
            ->latest()
            ->get();

        return response()->json($properties);
    }

    /**
     * Store a newly created property assigned to an owner by Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'owner_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'description' => 'nullable|string',
            'location_map_link' => 'nullable|string',
        ]);

        $property = Property::create($validated);

        return response()->json([
            'message' => 'Property created successfully',
            'data' => $property->load(['owner:id,name,email', 'images']),
        ], 201);
    }

    /**
     * Display the specified property.
     */
    public function show($id): JsonResponse
    {
        $property = Property::withCount('rooms')
            ->with(['owner:id,name,email', 'images', 'rooms'])
            ->findOrFail($id);

        return response()->json($property);
    }

    /**
     * Update the specified property.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $property = Property::findOrFail($id);

        $validated = $request->validate([
            'owner_id' => 'sometimes|required|exists:users,id',
            'title' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'location_map_link' => 'nullable|string',
        ]);

        $property->update($validated);

        return response()->json([
            'message' => 'Property updated successfully',
            'data' => $property->load(['owner:id,name,email', 'images']),
        ]);
    }

    /**
     * Remove the specified property.
     */
    public function destroy($id): JsonResponse
    {
        $property = Property::findOrFail($id);
        $property->delete();

        return response()->json(['message' => 'Property deleted by Admin successfully']);
    }
}
