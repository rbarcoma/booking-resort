<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('full_name');
            $table->string('facebook')->nullable();
            $table->string('email');
            $table->string('contact_number', 20);
            $table->foreignId('resort_option_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('pax');
            $table->date('booking_date');
            $table->string('booking_time');
            $table->text('message')->nullable();
            $table->decimal('total_price', 10, 2);
            $table->string('payment_method')->default('Cash');
            $table->enum('booking_status', ['Pending', 'Confirmed', 'Cancelled'])->default('Pending');
            $table->timestamps();

            $table->unique(['resort_option_id', 'booking_date', 'booking_time'], 'unique_booking_slot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
