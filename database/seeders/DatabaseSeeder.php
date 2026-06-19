<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::ensurePrimaryAdministratorExists();

        $this->call([
            ResortOptionSeeder::class,
            SiteSettingSeeder::class,
        ]);

        $this->call(AdminSeeder::class);
    }
}
