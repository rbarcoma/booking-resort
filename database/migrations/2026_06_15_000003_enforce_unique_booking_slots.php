<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $uniqueName = 'unique_booking_slot';

    private string $statusIndexName = 'booking_slot_status_index';

    public function up(): void
    {
        $duplicates = DB::table('bookings')
            ->select('resort_option_id', 'booking_date', 'booking_time', DB::raw('COUNT(*) as duplicate_count'))
            ->groupBy('resort_option_id', 'booking_date', 'booking_time')
            ->havingRaw('COUNT(*) > 1')
            ->limit(5)
            ->get();

        if ($duplicates->isNotEmpty()) {
            $summary = $duplicates
                ->map(fn ($row) => "resort_option_id={$row->resort_option_id}, date={$row->booking_date}, schedule={$row->booking_time}, count={$row->duplicate_count}")
                ->implode(' | ');

            throw new RuntimeException(
                'Cannot add unique booking-slot protection because duplicate booking slots already exist. ' .
                'Resolve these duplicates first: '.$summary
            );
        }

        $this->dropIndexIfExists($this->statusIndexName);

        if (! $this->indexExists($this->uniqueName)) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->unique(['resort_option_id', 'booking_date', 'booking_time'], $this->uniqueName);
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists($this->uniqueName);

        if (! $this->indexExists($this->statusIndexName)) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index(
                    ['resort_option_id', 'booking_date', 'booking_time', 'booking_status'],
                    $this->statusIndexName
                );
            });
        }
    }

    private function dropIndexIfExists(string $indexName): void
    {
        if (! $this->indexExists($indexName)) {
            return;
        }

        try {
            Schema::table('bookings', function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), $indexName)) {
                throw $e;
            }
        }
    }

    private function indexExists(string $indexName): bool
    {
        $driver = DB::getDriverName();

        return match ($driver) {
            'mysql', 'mariadb' => DB::table(DB::raw('information_schema.statistics'))
                ->where('table_schema', DB::getDatabaseName())
                ->where('table_name', 'bookings')
                ->where('index_name', $indexName)
                ->exists(),
            'pgsql' => DB::table(DB::raw('pg_indexes'))
                ->where('schemaname', 'public')
                ->where('tablename', 'bookings')
                ->where('indexname', $indexName)
                ->exists(),
            'sqlite' => collect(DB::select("PRAGMA index_list('bookings')"))
                ->contains(fn ($index) => ($index->name ?? null) === $indexName),
            default => false,
        };
    }
};
