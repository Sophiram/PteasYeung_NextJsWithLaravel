<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * Display a listing of all properties (Public).
     */
    public function index(Request $request): JsonResponse
    {
        $properties = Property::with(['images', 'owner:id,name,phone,email,profile_picture'])
            ->withCount('rooms')
            ->when($request->filled('city'), fn ($q) => $q->where('city', $request->city))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $properties,
        ]);
    }

    /**
     * Display the specified property details (Public).
     */
    public function show($id): JsonResponse
    {
        $property = Property::with(['images', 'owner:id,name,phone,email,profile_picture', 'rooms.images'])
            ->withCount('rooms')
            ->find($id);

        if (! $property) {
            return response()->json([
                'success' => false,
                'message' => 'រកមិនឃើញអចលនទ្រព្យនេះឡើយ',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $property,
        ]);
    }
}
