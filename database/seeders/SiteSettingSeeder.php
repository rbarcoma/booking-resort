<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SiteSetting;

class SiteSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sections = [
            ['section' => 'home', 'title' => 'Welcome to Our Resort', 'subtitle' => 'Relax and enjoy your stay'],
            ['section' => 'about', 'title' => 'About Us', 'description' => 'Your peaceful resort destination.'],
            ['section' => 'contact', 'title' => 'Contact Us'],
        ];

        foreach ($sections as $section) {
            SiteSetting::updateOrCreate(
                ['section' => $section['section']],
                $section
            );
        }
    }
}
