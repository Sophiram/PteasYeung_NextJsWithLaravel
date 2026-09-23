<?php

namespace App\Http\Controllers\Api;

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
     * Display a listing of bookings for the authenticated tenant.
     */
    public function index(): JsonResponse
    {
        $bookings = Booking::with(['room.property.images', 'room.images', 'invoices'])
            ->where('tenant_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Alias for tenant bookings (/api/my-bookings).
     */
    public function myBookings(): JsonResponse
    {
        return $this->index();
    }

    /**
     * Store a newly created booking by tenant.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id'        => 'required|exists:rooms,id',
            'check_in_date'  => 'required|date|after_or_equal:today',
            'check_out_date' => 'nullable|date|after:check_in_date',
            // deposit_amount intentionally NOT accepted from client — always set server-side
        ]);

        $roomId  = $validated['room_id'];
        $checkIn = $validated['check_in_date'];
        $checkOut = $validated['check_out_date'] ?? null;

        // Quick pre-check (non-locking) for fast feedback before entering the transaction
        $room = Room::with('property')->findOrFail($roomId);

        if (strtolower($room->status) !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'បន្ទប់នេះមិនទំនេរសម្រាប់កក់ឡើយ!',
            ], 422);
        }

        // Atomic availability check + booking creation inside a locked transaction
        // to prevent race conditions when multiple tenants book simultaneously.
        try {
            $booking = DB::transaction(function () use ($roomId, $checkIn, $checkOut, $room) {
                // Acquire a row-level lock so concurrent requests queue up here
                $lockedRoom = Room::with('property')->lockForUpdate()->findOrFail($roomId);

                if (strtolower($lockedRoom->status) !== 'available') {
                    throw new \RuntimeException('ROOM_UNAVAILABLE');
                }

                // Date-overlap check inside the lock
                $isBooked = Booking::where('room_id', $roomId)
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

                // Always use the room's configured deposit — never trust client input
                $depositAmount = (float) ($lockedRoom->deposit ?? 0);

                $newBooking = Booking::create([
                    'room_id'        => $lockedRoom->id,
                    'tenant_id'      => Auth::id(),
                    'owner_id'       => $lockedRoom->property->owner_id ?? null,
                    'check_in_date'  => $checkIn,
                    'check_out_date' => $checkOut,
                    'deposit_amount' => $depositAmount,
                    'status'         => 'pending',
                ]);

                $lockedRoom->update(['status' => 'Occupied']);

                // 🧾 បង្កើតវិក្កយបត្រដំបូងសម្រាប់ការកក់បន្ទប់ (ថ្លៃជួលបន្ទប់ + ប្រាក់កក់)
                $totalAmount = (float) ($lockedRoom->price ?? 0) + $depositAmount;
                Invoice::create([
                    'booking_id'              => $newBooking->id,
                    'electricity_start_unit'  => 0,
                    'electricity_end_unit'    => 0,
                    'water_unit'              => 0,
                    'total_amount'            => $totalAmount,
                    'payment_status'          => 'unpaid',
                    'due_date'                => $checkIn,
                ]);

                return $newBooking;
            });
        } catch (\RuntimeException $e) {
            $message = $e->getMessage() === 'DATE_CONFLICT'
                ? 'បន្ទប់នេះត្រូវបានគេកក់រួចហើយក្នុងកាលបរិច្ឆេទនេះ'
                : 'បន្ទប់នេះទើបតែត្រូវបានគេកក់ទៅហើយ។ សូមព្យាយាមម្តងទៀត!';

            return response()->json(['success' => false, 'message' => $message], 422);
        }

        // 🔔 Send Notifications to Owner, Super Admin, and Tenant
        try {
            $tenantName = Auth::user()->name ?? 'អ្នកជួល';
            $roomName = $room->room_number ?? 'បន្ទប់';
            $propTitle = $room->property->title ?? 'ផ្ទះជួល';

            // 1. Notify Property Owner
            if (! empty($room->property->owner_id)) {
                Notification::sendToUser(
                    $room->property->owner_id,
                    'ការកក់បន្ទប់ថ្មី! (New Booking)',
                    "អ្នកជួល {$tenantName} បានស្នើសុំកក់បន្ទប់ {$roomName} នៅ {$propTitle}។",
                    'booking',
                    '/dashboard/owner/bookings',
                    ['booking_id' => $booking->id, 'room_id' => $room->id]
                );
            }

            // 2. Notify Super Admin
            Notification::sendToRole(
                'super_admin',
                'ការកក់បន្ទប់ថ្មីក្នុងប្រព័ន្ធ (New Platform Booking)',
                "អ្នកជួល {$tenantName} បានកក់បន្ទប់ {$roomName} ({$propTitle})។",
                'booking',
                '/dashboard/admin',
                ['booking_id' => $booking->id]
            );

            // 3. Confirm to Tenant
            Notification::sendToUser(
                Auth::id(),
                'ការកក់ទទួលបានជោគជ័យ (Booking Submitted)',
                "សំណើកក់បន្ទប់ {$roomName} ត្រូវបានផ្ញើជូនម្ចាស់ផ្ទះរួចរាល់ហើយ។ សូមរង់ចាំការបញ្ជាក់ពីម្ចាស់ផ្ទះ។",
                'booking',
                '/dashboard/tenant/bookings',
                ['booking_id' => $booking->id]
            );
        } catch (\Throwable $e) {
            // Non-blocking notification failure
        }

        return response()->json([
            'success' => true,
            'message' => 'ការកក់របស់អ្នកត្រូវបានផ្ញើទៅកាន់ម្ចាស់ផ្ទះរួចរាល់ហើយ!',
            'data' => $booking->load(['room.property', 'room.images']),
        ], 201);
    }

    /**
     * Display the specified booking details.
     */
    public function show($id): JsonResponse
    {
        $booking = Booking::with(['room.property.images', 'room.images', 'invoices'])
            ->where('id', $id)
            ->where('tenant_id', Auth::id())
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Cancel a booking by tenant.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $booking = Booking::where('id', $id)
            ->where('tenant_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'status' => 'required|in:cancelled',
        ]);

        DB::transaction(function () use ($booking) {
            $booking->update(['status' => 'cancelled']);

            // Restore room status to Available if no other active booking exists
            $hasOtherActiveBooking = Booking::where('room_id', $booking->room_id)
                ->where('id', '!=', $booking->id)
                ->whereIn('status', ['active', 'confirmed'])
                ->exists();

            if (! $hasOtherActiveBooking) {
                $room = Room::find($booking->room_id);
                if ($room) {
                    $room->update(['status' => 'Available']);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'ការកក់របស់អ្នកត្រូវបានលុបចោលជោគជ័យ',
            'data' => $booking->load('room'),
        ]);
    }

    /**
     * Delete/cancel a booking.
     */
    public function destroy($id): JsonResponse
    {
        $booking = Booking::where('id', $id)
            ->where('tenant_id', Auth::id())
            ->firstOrFail();

        DB::transaction(function () use ($booking) {
            $hasOtherActiveBooking = Booking::where('room_id', $booking->room_id)
                ->where('id', '!=', $booking->id)
                ->whereIn('status', ['active', 'confirmed'])
                ->exists();

            if (! $hasOtherActiveBooking) {
                $room = Room::find($booking->room_id);
                if ($room) {
                    $room->update(['status' => 'Available']);
                }
            }

            $booking->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'បានលុបការកក់ជោគជ័យ!',
        ]);
    }
}
