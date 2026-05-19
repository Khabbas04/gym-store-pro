<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CollectionApiController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Collection::withCount('products')->get());
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $collection = \App\Models\Collection::create($validated);
        return response()->json($collection, 201);
    }

    public function update(\Illuminate\Http\Request $request, \App\Models\Collection $collection)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $collection->update($validated);
        return response()->json($collection);
    }

    public function destroy(\App\Models\Collection $collection)
    {
        $collection->delete();
        return response()->json(null, 204);
    }
}
