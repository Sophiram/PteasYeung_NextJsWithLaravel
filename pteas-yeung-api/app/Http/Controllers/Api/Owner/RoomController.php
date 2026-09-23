<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Room;
use App\Models\RoomImage;
use App\Services\ImageStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
{
    /**
     * Display a listing of rooms for the authenticated owner.
     */
    public function index(Request $request): JsonResponse
    {
        $ownerId = $request->user()->id;

        $rooms = Room::whereHas('property', function ($query) use ($ownerId) {
            $query->where('owner_id', $ownerId);
        })
            ->when($request->filled('property_id'), fn ($q) => $q->where('property_id', $request->property_id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->with(['property:id,title,city,address', 'images', 'activeBooking.tenant:id,name,phone,email'])
            ->latest()
            ->paginate(15);

        return response()->json($rooms);
    }

    /**
     * Store a newly created room by the owner.
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
            'image_url' => 'nullable|url',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        // Authorize property ownership
        $property = Property::where('id', $validated['property_id'])
            ->where('owner_id', $request->user()->id)
            ->first();

        if (! $property) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: This property does not belong to you.',
            ], 403);
        }

        $validated['status'] = $validated['status'] ?? 'Available';
        $roomData = collect($validated)->except(['images', 'image_url'])->toArray();

        $room = DB::transaction(function () use ($roomData, $request) {
            $newRoom = Room::create($roomData);

            if ($request->filled('image_url')) {
                RoomImage::create([
                    'room_id' => $newRoom->id,
                    'image_path' => $request->image_url,
                ]);
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $storedUrl = ImageStorageService::store($image, 'rooms');
                    RoomImage::create([
                        'room_id' => $newRoom->id,
                        'image_path' => $storedUrl,
                    ]);
                }
            }

            return $newRoom;
        });

        return response()->json([
            'success' => true,
            'message' => 'Room created successfully',
            'data' => $room->load(['property', 'images']),
        ], 201);
    }

    /**
     * Display the specified room details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $room = Room::where('id', $id)
            ->whereHas('property', function ($query) use ($request) {
                $query->where('owner_id', $request->user()->id);
            })
            ->with(['property.images', 'images', 'activeBooking.tenant', 'bookings.tenant'])
            ->first();

        if (! $room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found or unauthorized.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $room,
        ]);
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $room = Room::where('id', $id)
            ->whereHas('property', function ($query) use ($request) {
                $query->where('owner_id', $request->user()->id);
            })->firstOrFail();

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
            'image_url' => 'nullable|url',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        if (isset($validated['property_id']) && $validated['property_id'] !== $room->property_id) {
            $newProperty = Property::where('id', $validated['property_id'])
                ->where('owner_id', $request->user()->id)
                ->first();

            if (! $newProperty) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Target property does not belong to you.',
                ], 403);
            }
        }

        $roomData = collect($validated)->except(['images', 'image_url'])->toArray();

        DB::transaction(function () use ($room, $roomData, $request) {
            $room->update($roomData);

            if ($request->filled('image_url')) {
                RoomImage::create([
                    'room_id' => $room->id,
                    'image_path' => $request->image_url,
                ]);
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $storedUrl = ImageStorageService::store($image, 'rooms');
                    RoomImage::create([
                        'room_id' => $room->id,
                        'image_path' => $storedUrl,
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Room updated successfully',
            'data' => $room->fresh(['property', 'images']),
        ]);
    }

    /**
     * Remove the specified room and its images from storage.
     */
    public function destroy($id, Request $request): JsonResponse
    {
        $room = Room::where('id', $id)
            ->whereHas('property', function ($query) use ($request) {
                $query->where('owner_id', $request->user()->id);
            })->firstOrFail();

        DB::transaction(function () use ($room) {
            if ($room->images) {
                foreach ($room->images as $image) {
                    ImageStorageService::delete($image->image_path);
                    $image->delete();
                }
            }

            $room->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Room deleted successfully',
        ]);
    }

    /**
     * Check if the specified room is available.
     */
    public function checkAvailability(Request $request, $id): JsonResponse
    {
        $request->validate([
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
        ]);

        $checkIn = $request->check_in;
        $checkOut = $request->check_out;

        $isBooked = Booking::where('room_id', $id)
            ->whereIn('status', ['pending', 'active', 'confirmed'])
            ->where(function ($query) use ($checkIn, $checkOut) {
                $query->where(function ($q) use ($checkIn, $checkOut) {
                    $q->whereNotNull('check_out_date')
                        ->where('check_in_date', '<', $checkOut)
                        ->where('check_out_date', '>', $checkIn);
                })->orWhere(function ($q) use ($checkOut) {
                    $q->whereNull('check_out_date')
                        ->where('check_in_date', '<', $checkOut);
                });
            })->exists();

        return response()->json([
            'room_id' => (int) $id,
            'available' => ! $isBooked,
            'message' => $isBooked ? 'The room is already booked' : 'The room is available',
        ]);
    }

    /**
     * Remove a specific room image.
     */
    public function deleteImage(Request $request, $id): JsonResponse
    {
        $image = RoomImage::with(['room.property'])->find($id);

        if (! $image) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        if ($image->room->property->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        ImageStorageService::delete($image->image_path);

        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully',
        ]);
    }
}
