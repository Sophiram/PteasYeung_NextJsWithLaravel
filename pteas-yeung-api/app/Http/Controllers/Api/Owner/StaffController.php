<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    // មើលបញ្ជីបុគ្គលិកទាំងអស់ដែល Owner នេះជាអ្នកគ្រប់គ្រង
    public function index(Request $request) {
        return User::where('owner_id', $request->user()->id)
                   ->where('role', 'staff')
                   ->get();
    }

    // បន្ថែមបុគ្គលិកថ្មី (ក្នុងករណីបងចង់ឱ្យម្ចាស់ផ្ទះបង្កើត Account ឱ្យ Staff)
    public function store(Request $request) {
        $validated = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $staff = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => 'staff',
            'owner_id' => $request->user()->id, // ភ្ជាប់បុគ្គលិកនេះទៅម្ចាស់ផ្ទះ
        ]);

        return response()->json(['message' => 'Staff created successfully', 'data' => $staff], 201);
    }

    // លុបបុគ្គលិក
    public function destroy($id, Request $request) {
        $staff = User::where('id', $id)
                     ->where('owner_id', $request->user()->id)
                     ->where('role', 'staff')
                     ->firstOrFail();
        $staff->delete();

        return response()->json(['message' => 'Staff removed successfully']);
    }
    // កែសម្រួលព័ត៌មានបុគ្គលិក
    public function update(Request $request, $id) {
        $staff = User::where('id', $id)
                     ->where('owner_id', $request->user()->id)
                     ->where('role', 'staff')
                     ->firstOrFail();

        $validated = $request->validate([
            'name'  => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $id, // មិនឱ្យជាន់នឹង email អ្នកដទៃ
        ]);

        $staff->update($validated);

        return response()->json(['message' => 'Staff updated successfully', 'data' => $staff]);
    }
}
