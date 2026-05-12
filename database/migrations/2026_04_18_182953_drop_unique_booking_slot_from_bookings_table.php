<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index('resort_option_id', 'bookings_resort_option_id_index');
            $table->dropUnique('unique_booking_slot');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique(
                ['resort_option_id', 'booking_date', 'booking_time'],
                'unique_booking_slot'
            );

            $table->dropIndex('bookings_resort_option_id_index');
        });
    }
};
