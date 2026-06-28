<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    // ១. មើលបញ្ជីការកក់ទាំងអស់ដែលជារបស់ Owner នេះ
    public function index()
    {
        $ownerId = Auth::id();
        return Booking::where('owner_id', $ownerId)->latest()->get();
    }

    // ២. បង្កើតការកក់ថ្មី (Owner បង្កើតឱ្យ Tenant)
    public function store(Request $request)
    {
        $request->validate([
            'room_id'        => 'required|exists:rooms,id',
            'tenant_id'      => 'required|exists:users,id',
            'check_in_date'  => 'required|date',
            'check_out_date' => 'nullable|date|after:check_in_date',
            'deposit_amount' => 'required|numeric',
        ]);

        // ឆែកមើលស្ថានភាពបន្ទប់ទំនេរ
        $isBooked = Booking::where('room_id', $request->room_id)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($request) {
                $query->whereBetween('check_in_date', [$request->check_in_date, $request->check_out_date])
                    ->orWhereBetween('check_out_date', [$request->check_in_date, $request->check_out_date]);
            })->exists();

        if ($isBooked) {
            return response()->json(['message' => 'Room is already booked'], 422);
        }

        // យក owner_id ស្វ័យប្រវត្តពីបន្ទប់
        $room = Room::with('property')->findOrFail($request->room_id);
        $ownerId = $room->property->owner_id;

        $booking = Booking::create(array_merge($request->all(), ['owner_id' => $ownerId]));

        return response()->json(['message' => 'Booking created successfully', 'data' => $booking], 201);
    }

    // ៣. មើលព័ត៌មានលម្អិតការកក់ជាក់លាក់មួយ
    public function show($id)
    {
        return Booking::where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();
    }

    // ៤. កែសម្រួលទិន្នន័យការកក់
    public function update(Request $request, $id)
    {
        $booking = Booking::where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'tenant_id'      => 'sometimes|exists:users,id',
            'check_in_date'  => 'sometimes|date',
            'check_out_date' => 'sometimes|date|after:check_in_date',
        ]);

        $booking->update($request->all());

        return response()->json(['message' => 'Booking updated successfully', 'data' => $booking]);
    }

    // ៥. លុបការកក់
    public function destroy($id)
    {
        $booking = Booking::where('id', $id)
            ->where('owner_id', Auth::id())
            ->firstOrFail();

        $booking->delete();
        return response()->json(['message' => 'Booking deleted successfully']);
    }
}
