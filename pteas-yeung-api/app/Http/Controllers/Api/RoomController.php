<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    // ១. មើលបញ្ជីបន្ទប់ទាំងអស់ (Index)
    public function index(Request $request) {
        // 🟢 កែសម្រួល៖ ទោះបីជាមានលុកអ៊ីន ឬអត់លុកអ៊ីន ក៏យើងទាញ with('property') មកទាំងអស់ដើម្បីកុំឱ្យបាត់ទិន្នន័យលើ Frontend
        // ប៉ុន្តែបើមាន User លុកអ៊ីន (Owner/Staff) យើងចម្រាញ់ (Filter) យកតែបន្ទប់របស់គាត់
        if ($request->user()) {
            $rooms = Room::whereHas('property', function($query) use ($request) {
                $query->where('owner_id', $request->user()->id);
            })->with('property')->get();

            return response()->json($rooms);
        }

        // សម្រាប់ភ្ញៀវទូទៅមើលលើទំព័រដើម (សាធារណៈ)
        $rooms = Room::with('property')->get();
        return response()->json($rooms);
    }

    // ២. បង្កើតបន្ទប់ថ្មី (Store)
    public function store(Request $request) {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_number' => 'required',
            'price'       => 'required|numeric',
            'type'        => 'nullable|string',
            'status'      => 'nullable|string',
        ]);

        // បង្កើតបន្ទប់ជួលថ្មី និងភ្ជាប់ទៅកាន់ Property
        $room = Room::create($validated);

        // 🟢 ថែមត្រង់នេះ៖ បោះទិន្នន័យ property ត្រឡប់ទៅវិញភ្លាមៗក្រោយបង្កើតរួច ដើម្បីកុំឱ្យ React អត់ស្គាល់
        return response()->json($room->load('property'), 201);
    }

   // ៣. មើលព័ត៌មានលម្អិត (Show)
    public function show($id) {
        $room = Room::with('property')->find($id);

        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        return response()->json($room);
    }

    // ៤. កែសម្រួលបន្ទប់ (Update)
   public function update(Request $request, $id) {
        // 🟢 កែសម្រួល៖ ប្ដូរពីការឆែក owner_id ផ្ទាល់លើបន្ទប់ មកឆែកតាមរយៈ property វិញ (ព្រោះតារាង rooms គ្មាន owner_id ទេ)
        $room = Room::where('id', $id)
                    ->whereHas('property', function($query) use ($request) {
                        $query->where('owner_id', $request->user()->id);
                    })->firstOrFail();

        $room->update($request->all());

        // 🟢 ទាញទិន្នន័យ property មកជាមួយក្រោយពេល Update រួចរាល់
        return response()->json($room->load('property'));
    }

    // ៥. លុបបន្ទប់ (Destroy)
    public function destroy($id, Request $request) {
        $room = Room::where('id', $id)
                    ->whereHas('property', function($query) use ($request) {
                        $query->where('owner_id', $request->user()->id);
                    })->firstOrFail();

        $room->delete();
        return response()->json(['message' => 'Room deleted successfully']);
    }

// ៦. ពិនិត្យមើលបន្ទប់ទំនេរ
    public function checkAvailability(Request $request, $id)
    {
        $request->validate([
            'check_in'  => 'required|date',
            'check_out' => 'required|date|after:check_in',
        ]);

        $checkIn  = $request->check_in;
        $checkOut = $request->check_out;

        $isBooked = \App\Models\Booking::where('room_id', $id)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($checkIn, $checkOut) {
                $query->whereBetween('check_in_date', [$checkIn, $checkOut])
                    ->orWhereBetween('check_out_date', [$checkIn, $checkOut])
                    ->orWhere(function ($q) use ($checkIn, $checkOut) {
                        $q->where('check_in_date', '<=', $checkIn)
                            ->where('check_out_date', '>=', $checkOut);
                    });
            })->exists();

        return response()->json([
            'room_id' => $id,
            'available' => !$isBooked,
            'message' => $isBooked ? 'The room is already booked' : 'The room is available',
        ]);
    }
}
