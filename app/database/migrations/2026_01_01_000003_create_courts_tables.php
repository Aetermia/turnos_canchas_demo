<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sport', 40);
            $table->string('surface', 40)->nullable();
            $table->text('description')->nullable();
            $table->string('photo_path')->nullable();
            $table->boolean('is_active')->default(true);

            // Slot length and gap are per court: a 90 minute court and a 60 minute court coexist.
            $table->unsignedSmallInteger('slot_minutes')->default(60);
            $table->unsignedSmallInteger('buffer_minutes')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('court_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            // 1 = Monday ... 7 = Sunday, matching Carbon's isoWeekday().
            $table->unsignedTinyInteger('weekday');
            $table->boolean('is_open')->default(true);
            $table->time('opens_at')->default('08:00:00');
            $table->time('closes_at')->default('23:00:00');

            $table->unique(['court_id', 'weekday']);
        });

        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            // Null weekday means the rule applies to every day. A weekday rule wins.
            $table->unsignedTinyInteger('weekday')->nullable();
            $table->time('starts_at');
            $table->time('ends_at');
            $table->unsignedInteger('amount_cents');

            $table->timestamps();

            $table->index(['court_id', 'weekday', 'starts_at']);
        });

        Schema::create('blocked_periods', function (Blueprint $table) {
            $table->id();
            // Null court blocks the whole establishment.
            $table->foreignId('court_id')->nullable()->constrained()->cascadeOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('reason');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['court_id', 'starts_at', 'ends_at']);
        });
    }
};
