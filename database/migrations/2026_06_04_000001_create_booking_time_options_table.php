<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_time_options', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('time_range');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();

        DB::table('booking_time_options')->insert([
            [
                'label' => 'Morning',
                'time_range' => '7am to 5pm',
                'status' => 'active',
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'label' => 'Evening',
                'time_range' => '7pm to 5am',
                'status' => 'active',
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'label' => 'Whole Morning',
                'time_range' => '7am to 5am',
                'status' => 'active',
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'label' => 'Whole Evening',
                'time_range' => '5pm to 7pm',
                'status' => 'active',
                'sort_order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_time_options');
    }
};
