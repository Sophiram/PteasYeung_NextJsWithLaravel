<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * Display a listing of bookings for the owner's properties.
     */
    public function index(Request $request): JsonResponse
    {
        $ownerId = Auth::id();

        $bookings = Booking::with(['room.property', 'tenant', 'invoices'])
            ->where('owner_id', $ownerId)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('room_id'), fn ($q) => $q->where('room_id', $request->room_id))
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Store a newly created booking by the owner for a tenant.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id'       => 'required|exists:rooms,id',
            'tenant_id'     => 'required|exists:users,id',
            'check_in_date' => 'required|date',
            'check_out_date' => 'nullable|date|after:check_in_date',
            'deposit_amount' => 'required|numeric|min:0',
            'status'        => 'nullable|in:pending,confirmed,active',
        ]);

        $room = Room::with('property')->findOrFail($validated['room_id']);

        if ($room->property->owner_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: This room does not belong to your property.',
            ], 403);
        }

        $checkIn  = $validated['check_in_date'];
        $checkOut = $validated['check_out_date'] ?? null;
        $status   = $validated['status'] ?? 'active';

        try {
            $booking = DB::transaction(function () use ($validated, $room, $checkIn, $checkOut, $status) {
                // Lock room row to prevent concurrent double-bookings
                $lockedRoom = Room::with('property')->lockForUpdate()->findOrFail($room->id);

                if ($lockedRoom->property->owner_id !== Auth::id()) {
                    throw new \RuntimeException('UNAUTHORIZED');
                }

                // Date-overlap check inside lock
                $isBooked = Booking::where('room_id', $lockedRoom->id)
                    ->whereIn('status', ['pending', 'active', 'confirmed'])
                    ->lockForUpdate()
                    ->where(function ($query) use ($checkIn, $checkOut) {
                        if ($checkOut) {
                            $query->where(function ($q) use ($checkIn, $checkOut) {
                                $q->where(function ($sub) use ($checkIn, $checkOut) {
                                    $sub->whereNotNull('check_out_date')
                                        ->where('check_in_date', '<', $checkOut)
                                        ->where('check_out_date', '>', $checkIn);
                                })->orWhere(function ($sub) use ($checkOut) {
                                    $sub->whereNull('check_out_date')
                                        ->where('check_in_date', '<', $checkOut);
                                });
                            });
                        } else {
                            $query->where(function ($q) use ($checkIn) {
                                $q->where(function ($sub) use ($checkIn) {
                                    $sub->whereNotNull('check_out_date')
                                        ->where('check_out_date', '>', $checkIn);
                                })->orWhereNull('check_out_date');
                            });
                        }
                    })->exists();

                if ($isBooked) {
                    throw new \RuntimeException('DATE_CONFLICT');
                }

                $newBooking = Booking::create([
                    'room_id'        => $lockedRoom->id,
                    'tenant_id'      => $validated['tenant_id'],
                    'owner_id'       => Auth::id(),
                    'check_in_date'  => $checkIn,
                    'check_out_date' => $checkOut,
                    'deposit_amount' => $validated['deposit_amount'],
                    'status'         => $status,
                ]);

                if (in_array($status, ['active', 'confirmed'], true)) {
                    $lockedRoom->update(['status' => 'Occupied']);
                }

                // 🧾 បង្កើតវិក្កយបត្រដំបូងសម្រាប់ការកក់ (ថ្លៃជួលបន្ទប់ + ប្រាក់កក់)
                $totalAmount = (float) ($lockedRoom->price ?? 0) + (float) ($newBooking->deposit_amount ?? 0);
                Invoice::create([
                    'booking_id'             => $newBooking->id,
                    'electricity_start_unit' => 0,
                    'electricity_end_unit'   => 0,
                    'water_unit'             => 0,
                    'total_amount'           => $totalAmount,
                    'payment_status'         => in_array($status, ['active', 'confirmed'], true) ? 'paid' : 'unpaid',
                    'due_date'               => $checkIn,
                ]);

                return $newBooking;
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'UNAUTHORIZED') {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }
            return response()->json([
                'success' => false,
                'message' => 'Room is already booked for these dates',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking created successfully',
            'data'    => $booking->load(['room.property', 'tenant']),
        ], 201);
    }

    /**
     * Display the specified booking details.
     */
    public function show($id): JsonResponse
    {
        $booking = Booking::with(['room.property', 'tenant', 'invoices'])
            ->where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Update the specified booking details.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $booking = Booking::where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            // tenant_id intentionally excluded — reassigning a booking to another user is not permitted
            'check_in_date'  => 'sometimes|required|date',
            'check_out_date' => 'nullable|date|after:check_in_date',
            'deposit_amount' => 'nullable|numeric|min:0',
            'status'         => 'nullable|in:pending,confirmed,active,completed,ended,cancelled',
        ]);

        DB::transaction(function () use ($booking, $validated) {
            $booking->update($validated);

            if (isset($validated['status'])) {
                $this->syncRoomStatus($booking->room_id, $validated['status'], $booking->id);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully',
            'data' => $booking->load(['room.property', 'tenant']),
        ]);
    }

    /**
     * Remove the specified booking.
     */
    public function destroy($id): JsonResponse
    {
        $booking = Booking::where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();

        DB::transaction(function () use ($booking) {
            $roomId = $booking->room_id;
            $bookingId = $booking->id;
            $booking->delete();

            $this->syncRoomStatus($roomId, 'cancelled', $bookingId);
        });

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully',
        ]);
    }

    /**
     * Update the booking status and sync the room availability status.
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,active,cancelled,completed,ended',
        ]);

        $booking = Booking::where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();

        DB::transaction(function () use ($booking, $validated) {
            $booking->update(['status' => $validated['status']]);
            $this->syncRoomStatus($booking->room_id, $validated['status'], $booking->id);
        });

        // 🔔 Notify Tenant about status change
        try {
            if ($booking->tenant_id) {
                $statusDesc = match ($validated['status']) {
                    'confirmed' => 'ត្រូវបានម្ចាស់ផ្ទះយល់ព្រម (Confirmed)',
                    'active' => 'បានចាប់ផ្តើមចូលស្នាក់នៅ (Active)',
                    'cancelled' => 'ត្រូវបានបដិសេធ ឬលុបចោល (Cancelled)',
                    'completed', 'ended' => 'បានបញ្ចប់កិច្ចសន្យា (Completed)',
                    default => $validated['status'],
                };

                $roomNumber = $booking->room->room_number ?? 'បន្ទប់';

                Notification::sendToUser(
                    $booking->tenant_id,
                    'បច្ចុប្បន្នភាពការកក់បន្ទប់ (Booking Status Update)',
                    "ការកក់បន្ទប់ {$roomNumber} របស់អ្នក {$statusDesc}។",
                    'booking',
                    '/dashboard/tenant/bookings',
                    ['booking_id' => $booking->id, 'status' => $validated['status']]
                );
            }
        } catch (\Throwable $e) {
            // Non-blocking notification failure
        }

        return response()->json([
            'success' => true,
            'message' => 'ស្ថានភាពការកក់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ',
            'data' => $booking->fresh(['room.property', 'tenant']),
        ]);
    }

    /**
     * Helper to synchronize room status based on booking status.
     */
    private function syncRoomStatus(int $roomId, string $status, int $currentBookingId): void
    {
        $room = Room::find($roomId);
        if (! $room) {
            return;
        }

        if (in_array($status, ['cancelled', 'completed', 'ended'], true)) {
            $hasOtherActive = Booking::where('room_id', $roomId)
                ->where('id', '!=', $currentBookingId)
                ->whereIn('status', ['active', 'confirmed'])
                ->exists();

            if (! $hasOtherActive) {
                $room->update(['status' => 'Available']);
            }
        } elseif (in_array($status, ['confirmed', 'active'], true)) {
            $room->update(['status' => 'Occupied']);
        }
    }
}
