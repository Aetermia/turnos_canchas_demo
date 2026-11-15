<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('reservar', [BookingController::class, 'create'])->name('bookings.create');

Route::middleware(['auth', 'active'])->group(function () {
    Route::post('salir', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('mi-cuenta', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('mi-cuenta', [ProfileController::class, 'update'])->name('profile.update');

    Route::post('reservar', [BookingController::class, 'store'])->name('bookings.store');
    Route::get('mis-reservas', [BookingController::class, 'index'])->name('bookings.mine');
    Route::patch('mis-reservas/{booking}/cancelar', [BookingController::class, 'cancel'])->name('bookings.cancel');
});

require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
