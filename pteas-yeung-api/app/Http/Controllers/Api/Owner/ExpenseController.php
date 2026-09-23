<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses for the authenticated owner.
     */
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::where('owner_id', $request->user()->id)
            ->with('property:id,title,city')
            ->when($request->filled('property_id'), function ($q) use ($request) {
                $q->where('property_id', $request->property_id);
            })
            ->when($request->filled('start_date'), function ($q) use ($request) {
                $q->whereDate('date', '>=', $request->start_date);
            })
            ->when($request->filled('end_date'), function ($q) use ($request) {
                $q->whereDate('date', '<=', $request->end_date);
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $expenses,
            'total_amount' => (float) $expenses->sum('amount'),
        ]);
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id' => 'nullable|exists:properties,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'date' => 'required|date',
        ]);

        if (! empty($validated['property_id'])) {
            $ownsProperty = Property::where('id', $validated['property_id'])
                ->where('owner_id', $request->user()->id)
                ->exists();

            if (! $ownsProperty) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: This property does not belong to you.',
                ], 403);
            }
        }

        $validated['owner_id'] = $request->user()->id;

        $expense = Expense::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense recorded successfully',
            'data' => $expense->load('property:id,title'),
        ], 201);
    }

    /**
     * Display the specified expense details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $expense = Expense::where('id', $id)
            ->where('owner_id', $request->user()->id)
            ->with('property:id,title')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $expense,
        ]);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $expense = Expense::where('id', $id)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'property_id' => 'nullable|exists:properties,id',
            'title' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'date' => 'sometimes|required|date',
        ]);

        if (array_key_exists('property_id', $validated) && ! empty($validated['property_id'])) {
            $ownsProperty = Property::where('id', $validated['property_id'])
                ->where('owner_id', $request->user()->id)
                ->exists();

            if (! $ownsProperty) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Target property does not belong to you.',
                ], 403);
            }
        }

        $expense->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'data' => $expense->load('property:id,title'),
        ]);
    }

    /**
     * Remove the specified expense from storage.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $expense = Expense::where('id', $id)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully',
        ]);
    }
}
