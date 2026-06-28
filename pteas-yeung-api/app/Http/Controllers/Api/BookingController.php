<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    // ១. មើលបញ្ជីការកក់ផ្ទាល់ខ្លួនរបស់ Tenant (តាមរយៈផ្លូវ /api/bookings)
    public function index()
    {
        return Booking::where('tenant_id', Auth::id())->latest()->get();
    }

    // 🎯 ២. មុខងារដែលបងចង់ដាក់ (GET /api/my-bookings)
    public function myBookings()
    {
        return Booking::where('tenant_id', Auth::id())->latest()->get();
    }

    // ៣. ច្រកសម្រាប់ Tenant កក់បន្ទប់ដោយខ្លួនឯង (POST /api/bookings)
    public function store(Request $request)
    {
        $request->validate([
            'room_id'        => 'required|exists:rooms,id',
            'check_in_date'  => 'required|date|after_or_equal:today',
            'check_out_date' => 'nullable|date|after:check_in_date',
        ]);

        // ឆែកមើលស្ថានភាពបន្ទប់ទំនេរ
        $isBooked = Booking::where('room_id', $request->room_id)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($request) {
                $query->whereBetween('check_in_date', [$request->check_in_date, $request->check_out_date])
                    ->orWhereBetween('check_out_date', [$request->check_in_date, $request->check_out_date]);
            })->exists();

        if ($isBooked) {
            return response()->json(['message' => 'បន្ទប់នេះត្រូវបានគេកក់រួចហើយក្នុងកាលបរិច្ឆេទនេះ'], 422);
        }

        // ចាប់យក owner_id ពីបន្ទប់
        $room = Room::with('property')->findOrFail($request->room_id);
        $owner_id = $room->property->owner_id;

        // បង្កើតការកក់ក្នុងស្ថានភាព Pending
        $booking = Booking::create([
            'room_id'        => $request->room_id,
            'tenant_id'      => Auth::id(),
            'owner_id'       => $owner_id,
            'check_in_date'  => $request->check_in_date,
            'check_out_date' => $request->check_out_date,
            'deposit_amount' => 0,
            'status'         => 'pending'
        ]);

        return response()->json([
            'message' => 'ការកក់របស់អ្នកត្រូវបានផ្ញើទៅកាន់ម្ចាស់ផ្ទះរួចរាល់ហើយ!',
            'data'    => $booking
        ], 201);
    }

    // ៤. មើលព័ត៌មានលម្អិតការកក់របស់ខ្លួនឯង (GET /api/bookings/{id})
    public function show($id)
    {
        return Booking::where('id', $id)
            ->where('tenant_id', Auth::id())
            ->firstOrFail();
    }

    // ៥. ករណី Tenant ចង់ Cancel ការកក់ (PUT /api/bookings/{id})
    public function update(Request $request, $id)
    {
        $booking = Booking::where('id', $id)
            ->where('tenant_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'status' => 'required|in:cancelled',
        ]);

        $booking->update(['status' => 'cancelled']);

        return response()->json(['message' => 'ការកក់របស់អ្នកត្រូវបានលុបចោលជោគជ័យ', 'data' => $booking]);
    }
}
