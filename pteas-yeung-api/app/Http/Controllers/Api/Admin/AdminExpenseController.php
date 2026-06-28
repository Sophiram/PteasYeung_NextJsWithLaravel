<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense; // ត្រូវប្រាកដថាមាន Model Expense
use Illuminate\Http\Request;

class AdminExpenseController extends Controller
{
    // GET: /api/admin/expenses (មើលបញ្ជីចំណាយទាំងអស់)
    public function index()
    {
        return response()->json(Expense::orderBy('created_at', 'desc')->get());
    }

    // POST: /api/admin/expenses (បង្កើតការចំណាយថ្មី)
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'amount' => 'required|numeric',
            'date' => 'required|date',
            'category' => 'nullable|string',
        ]);

        $expense = Expense::create($request->all());
        return response()->json(['message' => 'បង្កើតការចំណាយជោគជ័យ!', 'data' => $expense], 201);
    }

    // PUT: /api/admin/expenses/{id} (កែប្រែការចំណាយ)
    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);
        $expense->update($request->all());
        return response()->json(['message' => 'ធ្វើបច្ចុប្បន្នភាពជោគជ័យ!', 'data' => $expense]);
    }

    // DELETE: /api/admin/expenses/{id} (លុបការចំណាយ)
    public function destroy($id)
    {
        Expense::findOrFail($id)->delete();
        return response()->json(['message' => 'លុបការចំណាយជោគជ័យ!']);
    }
}
