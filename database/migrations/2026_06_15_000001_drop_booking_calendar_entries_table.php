<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('booking_calendar_entries');
    }

    public function down(): void
    {
        Schema::create('booking_calendar_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->date('calendar_date');
            $table->string('status');
            $table->timestamps();

            $table->unique(['booking_id', 'calendar_date']);
        });
    }
};
