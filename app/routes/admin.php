<?php

use App\Http\Controllers\Admin\BlockedPeriodController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\CalendarController;
use App\Http\Controllers\Admin\CourtController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\SettingsController;
use Illuminate\Support\Facades\Route;

// Staff area. Individual abilities are still checked by policies in the controllers.
Route::middleware(['auth', 'active', 'staff'])->prefix('panel')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('calendario', [CalendarController::class, 'index'])->name('calendar');

    Route::get('reservas', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('reservas/nueva', [BookingController::class, 'create'])->name('bookings.create');
    Route::post('reservas', [BookingController::class, 'store'])->name('bookings.store');
    Route::get('reservas/{booking}', [BookingController::class, 'show'])->name('bookings.show');
    Route::patch('reservas/{booking}/confirmar', [BookingController::class, 'confirm'])->name('bookings.confirm');
    Route::patch('reservas/{booking}/cancelar', [BookingController::class, 'cancel'])->name('bookings.cancel');
    Route::patch('reservas/{booking}/cerrar', [BookingController::class, 'close'])->name('bookings.close');
    Route::patch('reservas/{booking}/reprogramar', [BookingController::class, 'reschedule'])->name('bookings.reschedule');

    Route::get('clientes', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('clientes', [CustomerController::class, 'store'])->name('customers.store');
    Route::get('clientes/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::patch('clientes/{customer}', [CustomerController::class, 'update'])->name('customers.update');

    Route::get('bloqueos', [BlockedPeriodController::class, 'index'])->name('blocks.index');
    Route::post('bloqueos', [BlockedPeriodController::class, 'store'])->name('blocks.store');
    Route::delete('bloqueos/{blockedPeriod}', [BlockedPeriodController::class, 'destroy'])->name('blocks.destroy');

    // Courts and establishment settings are admin only, enforced by policies.
    Route::get('canchas', [CourtController::class, 'index'])->name('courts.index');
    Route::get('canchas/nueva', [CourtController::class, 'create'])->name('courts.create');
    Route::post('canchas', [CourtController::class, 'store'])->name('courts.store');
    Route::get('canchas/{court}/editar', [CourtController::class, 'edit'])->name('courts.edit');
    Route::patch('canchas/{court}', [CourtController::class, 'update'])->name('courts.update');

    Route::get('configuracion', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::patch('configuracion', [SettingsController::class, 'update'])->name('settings.update');
});
