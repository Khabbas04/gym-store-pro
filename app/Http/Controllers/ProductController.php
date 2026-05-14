<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::latest()->get();

        // Demo fallback if DB is empty
        if ($products->isEmpty()) {
            $products = collect([
                (object)[
                    'id' => 1,
                    'name' => 'Velocity Pro Tee',
                    'slug' => 'velocity-pro-tee',
                    'description' => 'Premium athletic t-shirt with breathable stretch fabric for gym and casual wear.',
                    'price' => 24.90,
                    'image' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
                    'category' => 'Men',
                    'sizes' => ['S','M','L','XL'],
                    'featured' => true,
                ],
                (object)[
                    'id' => 2,
                    'name' => 'Core Flex Oversize',
                    'slug' => 'core-flex-oversize',
                    'description' => 'Oversized performance fit designed for comfort, training, and everyday style.',
                    'price' => 29.90,
                    'image' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
                    'category' => 'Unisex',
                    'sizes' => ['M','L','XL'],
                    'featured' => true,
                ],
                (object)[
                    'id' => 3,
                    'name' => 'Aero Fit Training Tee',
                    'slug' => 'aero-fit-training-tee',
                    'description' => 'Lightweight and sweat-friendly tee perfect for running, lifting, and active days.',
                    'price' => 21.50,
                    'image' => 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
                    'category' => 'Women',
                    'sizes' => ['S','M','L'],
                    'featured' => false,
                ],
            ]);
        }

        return view('products.index', compact('products'));
    }

    public function show(Product $product)
    {
        return view('products.show', compact('product'));
    }

    public function create()
    {
        return view('products.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|url',
            'category' => 'required|string|max:100',
            'sizes' => 'nullable|string',
            'featured' => 'nullable|boolean',
        ]);

        $product = Product::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . now()->timestamp,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image' => $validated['image'] ?? 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
            'category' => $validated['category'],
            'sizes' => isset($validated['sizes']) ? array_map('trim', explode(',', $validated['sizes'])) : ['M', 'L'],
            'featured' => $request->boolean('featured'),
        ]);

        return redirect()->route('products.show', $product)->with('success', 'Product created successfully.');
    }
}
