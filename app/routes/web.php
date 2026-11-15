<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => inertia('Home'))->name('home');

Route::middleware(['auth', 'active'])->group(function () {
    Route::post('salir', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('mi-cuenta', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('mi-cuenta', [ProfileController::class, 'update'])->name('profile.update');
});

require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
