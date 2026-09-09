<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_setting_media', function (Blueprint $table) {
            // Existing uploads need an explicit admin assignment; never guess their pool.
            $table->string('pool', 20)->nullable();
            $table->string('category', 20)->nullable();
            $table->index(['site_setting_id', 'pool', 'category']);
        });

        // Make legacy standalone About images manageable without copying or moving files.
        foreach (DB::table('site_settings')->where('section', 'about')->whereNotNull('image')->get() as $about) {
            $media = DB::table('site_setting_media')->where('site_setting_id', $about->id);

            if ($about->image && ! (clone $media)->where('media_path', $about->image)->exists()) {
                DB::table('site_setting_media')->insert([
                    'site_setting_id' => $about->id,
                    'media_path' => $about->image,
                    'media_type' => 'image',
                    'label' => 'About image',
                    'sort_order' => ((int) $media->max('sort_order')) + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('site_setting_media', function (Blueprint $table) {
            $table->dropIndex(['site_setting_id', 'pool', 'category']);
            $table->dropColumn(['pool', 'category']);
        });
    }
};
