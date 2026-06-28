<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request) {
        return \App\Models\Expense::where('owner_id', $request->user()->id)->get();
    }


    public function store(Request $request) {
        $data = $request->all();
        $data['owner_id'] = $request->user()->id;
        return \App\Models\Expense::create($data);
    }
    // កែសម្រួលព័ត៌មានចំណាយ
    public function update(Request $request, $id) {
        $expense = \App\Models\Expense::where('id', $id)
                                      ->where('owner_id', $request->user()->id)
                                      ->firstOrFail();

        $expense->update($request->all());

        return response()->json(['message' => 'Expense updated successfully', 'data' => $expense]);
    }

    // លុបចំណាយ
    public function destroy($id, Request $request) {
        $expense = \App\Models\Expense::where('id', $id)
                                      ->where('owner_id', $request->user()->id)
                                      ->firstOrFail();

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }
}
