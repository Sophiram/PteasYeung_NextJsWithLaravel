<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a listing of rooms (Public or filtered for authenticated owner/staff).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Room::with(['property.images', 'property.owner:id,name,phone,email,profile_picture', 'images']);

        // Filter by property if requested
        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        // Filter by status if requested
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by room type if requested
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by floor
        if ($request->filled('floor')) {
            $query->where('floor', $request->floor);
        }

        // Filter by price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        // Search by room number or description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('room_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // If authenticated owner/staff filtering their own rooms
        if ($request->user() && in_array($request->user()->role, ['owner', 'staff'], true)) {
            $ownerId = $request->user()->role === 'staff'
                ? $request->user()->owner_id
                : $request->user()->id;

            if ($ownerId) {
                $query->whereHas('property', function ($q) use ($ownerId) {
                    $q->where('owner_id', $ownerId);
                });
            }
        }

        $rooms = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $rooms,
        ]);
    }

    /**
     * Display the specified room details.
     */
    public function show($id): JsonResponse
    {
        $room = Room::with(['property.images', 'property.owner:id,name,phone,email,profile_picture', 'images'])->find($id);

        if (! $room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $room,
        ]);
    }

    /**
     * Send an inquiry message to the property owner regarding this room.
     */
    public function contactOwner(Request $request, $id): JsonResponse
    {
        $room = Room::with('property.owner')->find($id);

        if (! $room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:100',
            'message' => 'required|string|max:1000',
        ]);

        $owner = $room->property?->owner;

        if ($owner) {
            \App\Models\Notification::sendToUser(
                $owner->id,
                "សំណួរសាកសួរអំពីបន្ទប់ {$room->room_number} (Room Inquiry)",
                "អតិថិជន {$validated['name']} (ទូរស័ព្ទ: {$validated['phone']}) បានផ្ញើសារ៖ \"{$validated['message']}\"",
                'info',
                '/dashboard/owner/rooms',
                [
                    'room_id' => $room->id,
                    'room_number' => $room->room_number,
                    'property_title' => $room->property?->title,
                    'sender_name' => $validated['name'],
                    'sender_phone' => $validated['phone'],
                    'sender_email' => $validated['email'] ?? null,
                    'message' => $validated['message'],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'សារសាកសួររបស់អ្នកត្រូវបានផ្ញើជូនម្ចាស់ផ្ទះរួចរាល់ហើយ!',
        ]);
    }

    /**
     * Check if the specified room is available for the given date range.
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
            'success' => true,
            'room_id' => (int) $id,
            'available' => ! $isBooked,
            'message' => $isBooked ? 'The room is already booked' : 'The room is available',
        ]);
    }

    /**
     * Update room status (used by Staff or Owner via /rooms/check-status).
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'status' => 'required|in:Available,Occupied,Maintenance',
        ]);

        $user = $request->user();
        $room = Room::with('property')->findOrFail($validated['room_id']);

        // Check permission if staff
        if ($user && $user->role === 'staff') {
            if ($room->property->owner_id !== $user->owner_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You can only update rooms of your assigned owner.',
                ], 403);
            }
        } elseif ($user && $user->role === 'owner') {
            if ($room->property->owner_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: This room does not belong to your property.',
                ], 403);
            }
        }

        $room->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'ស្ថានភាពបន្ទប់ត្រូវបានកែប្រែដោយជោគជ័យ!',
            'data' => $room->load(['property', 'images']),
        ]);
    }
}
