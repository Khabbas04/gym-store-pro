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
            'image' => 'nullable',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadOrStoreImage($request->file('image'));
        }

        $collection = \App\Models\Collection::create($validated);
        return response()->json($collection, 201);
    }

    public function update(\Illuminate\Http\Request $request, \App\Models\Collection $collection)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadOrStoreImage($request->file('image'));
        }

        $collection->update($validated);
        return response()->json($collection);
    }

    public function destroy(\App\Models\Collection $collection)
    {
        $collection->delete();
        return response()->json(null, 204);
    }

    private function uploadOrStoreImage($file)
    {
        $imgbbKey = env('IMGBB_API_KEY');
        if ($imgbbKey) {
            try {
                $response = \Illuminate\Support\Facades\Http::asMultipart()
                    ->post('https://api.imgbb.com/1/upload', [
                        'key' => $imgbbKey,
                        'image' => base64_encode(file_get_contents($file->getPathname())),
                    ]);

                if ($response->successful()) {
                    return $response->json('data.url');
                } else {
                    throw new \Exception('ImgBB response failed: ' . $response->body());
                }
            } catch (\Throwable $e) {
                throw new \Exception('Failed to upload image to ImgBB CDN: ' . $e->getMessage());
            }
        } else {
            try {
                $path = $file->store('collections', 'public');
                return '/storage/' . $path;
            } catch (\Throwable $e) {
                if (str_contains($e->getMessage(), 'Unable to create a directory')) {
                    throw new \Exception('Vercel is read-only. To upload collection images on Vercel, please register a free API Key on https://api.imgbb.com/ and add "IMGBB_API_KEY" to your Vercel Environment Variables.');
                }
                throw $e;
            }
        }
    }
}
