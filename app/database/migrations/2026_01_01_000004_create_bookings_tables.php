<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('court_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->unsignedSmallInteger('duration_minutes');

            // ARS cents: integers avoid float drift on money.
            $table->unsignedInteger('price_cents');

            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();

            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cancellation_reason')->nullable();

            $table->timestamps();

            // Overlap lookups: WHERE court_id = ? AND starts_at < ? AND ends_at > ?
            $table->index(['court_id', 'starts_at', 'ends_at']);
            $table->index(['court_id', 'status', 'starts_at']);
            $table->index(['user_id', 'starts_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60);
            $table->string('subject_type', 60);
            $table->unsignedBigInteger('subject_id');
            $table->json('meta')->nullable();
            $table->string('ip', 45)->nullable();

            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
        });
    }
};
