<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('ingresar', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('ingresar', [AuthenticatedSessionController::class, 'store']);

    Route::get('registro', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('registro', [RegisteredUserController::class, 'store']);

    Route::get('recuperar-contraseña', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('recuperar-contraseña', [PasswordResetLinkController::class, 'store'])->name('password.email');

    Route::get('restablecer-contraseña/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('restablecer-contraseña', [NewPasswordController::class, 'store'])->name('password.store');
});
