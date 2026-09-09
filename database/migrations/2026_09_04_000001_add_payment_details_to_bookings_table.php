<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_type')->nullable()->after('payment_method');
            $table->decimal('amount_paid', 10, 2)->nullable()->after('payment_type');
            $table->decimal('remaining_balance', 10, 2)->nullable()->after('amount_paid');
            $table->string('proof_of_payment_path')->nullable()->after('remaining_balance');
            $table->string('payment_status')->nullable()->index()->after('booking_status');
            $table->timestamp('payment_reviewed_at')->nullable()->after('payment_status');
            $table->foreignId('payment_reviewed_by')
                ->nullable()
                ->after('payment_reviewed_at')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['payment_reviewed_by']);
            $table->dropColumn([
                'payment_type',
                'amount_paid',
                'remaining_balance',
                'proof_of_payment_path',
                'payment_status',
                'payment_reviewed_at',
                'payment_reviewed_by',
            ]);
        });
    }
};
