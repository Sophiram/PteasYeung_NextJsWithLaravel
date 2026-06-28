<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    // Admin មើលឃើញអចលនទ្រព្យទាំងអស់ក្នុងប្រព័ន្ធ
    public function index() {
        return Property::withCount('rooms')->with('owner:id,name,email')->latest()->get();
    }

    // Admin បង្កើតអចលនទ្រព្យឱ្យទៅ Owner ណាម្នាក់
    public function store(Request $request) {
        $validated = $request->validate([
            'title' => 'required|string',
            'address' => 'required|string',
            'owner_id' => 'required|exists:users,id', // Admin ត្រូវជ្រើសរើស Owner
        ]);

        return Property::create($request->all());
    }

    // Admin មើលព័ត៌មានលម្អិតនៃអចលនទ្រព្យណាមួយក៏បាន
    public function show($id) {
        return Property::withCount('rooms')->with('owner:id,name,email')->findOrFail($id);
    }

    // Admin កែសម្រួលបានទាំងអស់
    public function update(Request $request, $id) {
        $property = Property::findOrFail($id);
        $property->update($request->all());
        return $property;
    }

    // Admin លុបបានទាំងអស់
    public function destroy($id) {
        $property = Property::findOrFail($id);
        $property->delete();
        return response()->json(['message' => 'Property deleted by Admin successfully']);
    }
}
