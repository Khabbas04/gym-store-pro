<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users
        User::create([
            'name' => 'Sirius Admin',
            'email' => 'admin@sirius.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'api_token' => 'admin-token-secret-123',
        ]);

        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('user123'),
            'role' => 'user',
            'api_token' => 'user-token-secret-123',
        ]);

        // 2. Seed Premium Gym Products
        $products = [
            [
                'name' => 'Velocity Pro Tee',
                'description' => 'Premium athletic t-shirt with breathable stretch fabric for gym and casual wear.',
                'price' => 24.90,
                'image' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
                'category' => 'Men',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'featured' => true,
                'stock_quantity' => 45,
                'is_popular' => true,
            ],
            [
                'name' => 'Core Flex Oversize',
                'description' => 'Oversized performance fit designed for comfort, training, and everyday style.',
                'price' => 29.90,
                'image' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
                'category' => 'Unisex',
                'sizes' => ['M', 'L', 'XL'],
                'featured' => true,
                'stock_quantity' => 30,
                'is_popular' => true,
            ],
            [
                'name' => 'Aero Fit Training Tee',
                'description' => 'Lightweight and sweat-friendly tee perfect for running, lifting, and active days.',
                'price' => 21.50,
                'image' => 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
                'category' => 'Women',
                'sizes' => ['S', 'M', 'L'],
                'featured' => false,
                'stock_quantity' => 50,
                'is_popular' => false,
            ],
            [
                'name' => 'Apex Pro Kettlebell (16kg)',
                'description' => 'Solid cast-iron kettlebell with a textured handle for comfortable, secure gripping.',
                'price' => 49.99,
                'image' => 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80',
                'category' => 'Equipments',
                'sizes' => ['One Size'],
                'featured' => true,
                'stock_quantity' => 15,
                'is_popular' => true,
            ],
            [
                'name' => 'Elite Carbon Lifting Belt',
                'description' => 'Ergonomic 4-inch back support belt lined with premium black suede and double-prong steel buckle.',
                'price' => 39.50,
                'image' => 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
                'category' => 'Accessories',
                'sizes' => ['S', 'M', 'L'],
                'featured' => true,
                'stock_quantity' => 20,
                'is_popular' => false,
            ],
            [
                'name' => 'Alpha Whey Protein Isolate (1kg)',
                'description' => 'Ultra-pure grass-fed whey protein isolate. 25g protein, 0g sugar, delicious double chocolate flavor.',
                'price' => 44.90,
                'image' => 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=80',
                'category' => 'Nutrition',
                'sizes' => ['1kg', '2kg'],
                'featured' => false,
                'stock_quantity' => 80,
                'is_popular' => true,
            ],
            [
                'name' => 'High-Bounce Pro Skipping Rope',
                'description' => 'Fully adjustable speed jump rope with high-precision steel ball bearings for smooth spinning.',
                'price' => 12.90,
                'image' => 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
                'category' => 'Accessories',
                'sizes' => ['One Size'],
                'featured' => false,
                'stock_quantity' => 120,
                'is_popular' => false,
            ],
            [
                'name' => 'Elite Rubber Dumbbell Set (10kg)',
                'description' => 'Premium hexagon rubber dumbbell pair. Noise-reducing, floor-friendly, with knurled steel grips.',
                'price' => 59.90,
                'image' => 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=900&q=80',
                'category' => 'Equipments',
                'sizes' => ['10kg', '15kg', '20kg'],
                'featured' => true,
                'stock_quantity' => 12,
                'is_popular' => true,
            ],
        ];

        foreach ($products as $prod) {
            Product::create([
                'name' => $prod['name'],
                'slug' => Str::slug($prod['name']),
                'description' => $prod['description'],
                'price' => $prod['price'],
                'image' => $prod['image'],
                'category' => $prod['category'],
                'sizes' => $prod['sizes'],
                'featured' => $prod['featured'],
                'stock_quantity' => $prod['stock_quantity'],
                'is_popular' => $prod['is_popular'],
            ]);
        }
    }
}
