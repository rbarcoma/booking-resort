<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ResortOption;

class ResortOptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ResortOption::updateOrCreate(
            ['slug' => 'lower-pool'],
            [
                'name' => 'Lower Pool',
                'price' => 3000,
                'max_pax' => 10,
                'description' => 'Relax and enjoy the lower pool area.',
                'status' => 'active',
            ]
        );

        ResortOption::updateOrCreate(
            ['slug' => 'upper-pool'],
            [
                'name' => 'Upper Pool',
                'price' => 5000,
                'max_pax' => 12,
                'description' => 'Enjoy the upper pool with a wider space and better view.',
                'status' => 'active',
            ]
        );
    }
}
