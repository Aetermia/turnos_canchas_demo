<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per installation. A template is deployed per establishment, so the
 * settings are a single record rather than key/value rows that all code must parse.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('establishment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('tagline')->nullable();
            $table->text('about')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('accent_color', 7)->default('#0f5c46');

            $table->string('phone', 30)->nullable();
            $table->string('whatsapp', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('maps_url')->nullable();

            $table->string('currency', 3)->default('ARS');
            $table->boolean('auto_confirm')->default(true);
            $table->boolean('pending_blocks_slot')->default(true);
            $table->unsignedSmallInteger('min_advance_minutes')->default(60);
            $table->unsignedSmallInteger('max_advance_days')->default(30);
            $table->unsignedSmallInteger('cancellation_hours')->default(24);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('establishment_settings');
    }
};
