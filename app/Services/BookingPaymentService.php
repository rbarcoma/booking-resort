<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingPaymentService
{
    /**
     * @return array{total: string, amount_paid: string, remaining_balance: string, total_cents: int}
     */
    public function calculate(string|int|float $total, string $paymentType): array
    {
        $totalCents = (int) round(((float) $total) * 100, 0, PHP_ROUND_HALF_UP);
        $amountPaidCents = $paymentType === Booking::PAYMENT_TYPE_FULL
            ? $totalCents
            : intdiv($totalCents + 1, 2);

        return [
            'total' => $this->formatCents($totalCents),
            'amount_paid' => $this->formatCents($amountPaidCents),
            'remaining_balance' => $this->formatCents($totalCents - $amountPaidCents),
            'total_cents' => $totalCents,
        ];
    }

    /**
     * @param  array{total: string, amount_paid: string, remaining_balance: string, total_cents: int}  $amounts
     */
    public function createQuote(
        string $reference,
        int $resortOptionId,
        string $paymentType,
        array $amounts,
    ): string {
        return Crypt::encryptString(json_encode([
            'reference' => $reference,
            'resort_option_id' => $resortOptionId,
            'payment_type' => $paymentType,
            'total_cents' => $amounts['total_cents'],
            'expires_at' => now()->addMinutes(
                (int) config('system.booking.payment_quote_expiration_minutes', 120),
            )->timestamp,
        ], JSON_THROW_ON_ERROR));
    }

    /**
     * @return array{reference: string, resort_option_id: int, payment_type: string, total_cents: int, expires_at: int}
     */
    public function validateQuote(
        string $encryptedQuote,
        int $resortOptionId,
        string $paymentType,
        int $totalCents,
    ): array {
        try {
            $quote = json_decode(Crypt::decryptString($encryptedQuote), true, flags: JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            throw ValidationException::withMessages([
                'payment_quote' => 'The payment session is invalid. Please proceed to payment again.',
            ]);
        }

        if (
            ! is_array($quote)
            || ! isset($quote['reference'], $quote['resort_option_id'], $quote['payment_type'], $quote['total_cents'], $quote['expires_at'])
            || (int) $quote['expires_at'] < now()->timestamp
            || (int) $quote['resort_option_id'] !== $resortOptionId
            || (string) $quote['payment_type'] !== $paymentType
            || (int) $quote['total_cents'] !== $totalCents
        ) {
            throw ValidationException::withMessages([
                'payment_quote' => 'The payment details changed or expired. Please proceed to payment again.',
            ]);
        }

        return $quote;
    }

    public function referenceFromQuote(?string $encryptedQuote, int $resortOptionId): ?string
    {
        if (! $encryptedQuote) {
            return null;
        }

        try {
            $quote = json_decode(Crypt::decryptString($encryptedQuote), true, flags: JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            return null;
        }

        if (
            ! is_array($quote)
            || (int) ($quote['expires_at'] ?? 0) < now()->timestamp
            || (int) ($quote['resort_option_id'] ?? 0) !== $resortOptionId
        ) {
            return null;
        }

        $reference = (string) ($quote['reference'] ?? '');

        return preg_match('/^Q8-[0-9]{8}-[A-Z0-9]{12}$/', $reference) === 1
            ? $reference
            : null;
    }

    public function generateReference(): string
    {
        do {
            $reference = 'Q8-'.now()->format('Ymd').'-'.Str::upper(Str::random(12));
        } while (Booking::query()->where('booking_reference', $reference)->exists());

        return $reference;
    }

    private function formatCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
