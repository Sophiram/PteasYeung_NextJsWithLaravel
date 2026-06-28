<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\User;

class AdminUserController extends Controller
{
    public function index(Request $request) {
        $query = User::query();

        // បើចង់ស្វែងរកតាមឈ្មោះ ឬ Email
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        return $query->get();
    }
    // ២. មើលព័ត៌មានលម្អិតរបស់ User ណាម្នាក់
    public function show($id) {
        return User::findOrFail($id);
    }

    // ៤. លុប User (ស្រាប់ហើយ)
    public function destroy($id) {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function update(Request $request, $id) {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$id,
        ]);

        $user = User::findOrFail($id);
        $user->update($request->only(['name', 'email']));

        return response()->json(['message' => 'User updated successfully', 'user' => $user]);
    }
        public function updateStatus(Request $request, $id) {
            // 🟢 ១. ប្តូរលក្ខខណ្ឌ Validation ឱ្យមកផ្ទៀងផ្ទាត់ពាក្យ active ឬ inactive វិញ
            $request->validate([
                'status' => 'required|in:active,inactive'
            ]);

            $user = User::findOrFail($id);

            // 🟢 ២. កែមកកាន់ Column 'status' ដែលមានស្រាប់ក្នុង Database របស់បង
            $user->status = $request->status;
            $user->save();

            return response()->json([
                'message' => 'Status updated successfully',
                'status' => $user->status
            ]);
        }

    public function changeRole(Request $request, $id) {
        // ត្រួតពិនិត្យថា role មានតែក្នុងចំណោមអ្វីដែលយើងអនុញ្ញាត
        $request->validate(['role' => 'required|in:owner,staff,tenant,admin']);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => 'Role updated to ' . $request->role]);
    }

}
