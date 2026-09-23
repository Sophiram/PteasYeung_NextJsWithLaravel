<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminExpenseController extends Controller
{
    /**
     * Display a listing of all expenses across the system.
     */
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::with(['owner:id,name,email', 'property:id,title'])
            ->when($request->filled('property_id'), function ($q) use ($request) {
                $q->where('property_id', $request->property_id);
            })
            ->when($request->filled('owner_id'), function ($q) use ($request) {
                $q->where('owner_id', $request->owner_id);
            })
            ->latest('date')
            ->get();

        return response()->json($expenses);
    }

    /**
     * Store a newly created expense by Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'owner_id' => 'nullable|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'description' => 'nullable|string|max:1000',
        ]);

        $validated['owner_id'] = $validated['owner_id'] ?? $request->user()->id;

        $expense = Expense::create($validated);

        return response()->json([
            'message' => 'បង្កើតការចំណាយជោគជ័យ!',
            'data' => $expense->load(['owner:id,name,email', 'property:id,title']),
        ], 201);
    }

    /**
     * Display the specified expense.
     */
    public function show($id): JsonResponse
    {
        $expense = Expense::with(['owner:id,name,email', 'property:id,title'])->findOrFail($id);

        return response()->json($expense);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'owner_id' => 'nullable|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'title' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
            'description' => 'nullable|string|max:1000',
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'ធ្វើបច្ចុប្បន្នភាពជោគជ័យ!',
            'data' => $expense->load(['owner:id,name,email', 'property:id,title']),
        ]);
    }

    /**
     * Remove the specified expense.
     */
    public function destroy($id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        return response()->json(['message' => 'លុបការចំណាយជោគជ័យ!']);
    }
}
