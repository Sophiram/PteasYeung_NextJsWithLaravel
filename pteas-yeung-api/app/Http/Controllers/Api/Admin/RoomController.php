<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a listing of all rooms across all properties.
     */
    public function index(Request $request): JsonResponse
    {
        $rooms = Room::with(['property.owner:id,name,email', 'images'])
            ->when($request->filled('property_id'), function ($q) use ($request) {
                $q->where('property_id', $request->property_id);
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->latest()
            ->paginate(15);

        return response()->json($rooms);
    }

    /**
     * Store a newly created room by Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_number' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'deposit' => 'nullable|numeric|min:0',
            'type' => 'required|in:Single,Double,Studio,Apartment',
            'status' => 'nullable|in:Available,Occupied,Maintenance',
            'floor' => 'nullable|string|max:255',
            'amenities' => 'nullable|array',
            'description' => 'nullable|string|max:255',
        ]);

        $validated['status'] = $validated['status'] ?? 'Available';

        $room = Room::create($validated);

        return response()->json([
            'message' => 'Room created successfully',
            'data' => $room->load(['property', 'images']),
        ], 201);
    }

    /**
     * Display the specified room.
     */
    public function show($id): JsonResponse
    {
        $room = Room::with(['property.owner:id,name,email', 'images', 'bookings'])->findOrFail($id);

        return response()->json($room);
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $room = Room::findOrFail($id);

        $validated = $request->validate([
            'property_id' => 'sometimes|required|exists:properties,id',
            'room_number' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'deposit' => 'nullable|numeric|min:0',
            'type' => 'sometimes|required|in:Single,Double,Studio,Apartment',
            'status' => 'sometimes|required|in:Available,Occupied,Maintenance',
            'floor' => 'nullable|string|max:255',
            'amenities' => 'nullable|array',
            'description' => 'nullable|string|max:255',
        ]);

        $room->update($validated);

        return response()->json([
            'message' => 'Room updated successfully',
            'data' => $room->load(['property', 'images']),
        ]);
    }

    /**
     * Remove the specified room.
     */
    public function destroy($id): JsonResponse
    {
        $room = Room::findOrFail($id);
        $room->delete();

        return response()->json(['message' => 'Room deleted by Admin successfully']);
    }
}
