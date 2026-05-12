<?php

use App\Http\Controllers\Admin\AdminCalendarController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LandingPageController as AdminLandingPageController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ResortOptionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\LandingPageController;
use Illuminate\Support\Facades\Route;

// Public Pages
Route::controller(LandingPageController::class)->group(function () {
    Route::get('/', 'index')->name('home');
});

// Public Booking Routes
Route::controller(BookingController::class)->group(function () {
    Route::get('/book-now', 'create')->name('bookings.create');
    Route::post('/book-now', 'store')->name('bookings.store');
    Route::get('/receipt/{booking}', 'receipt')->name('bookings.receipt');
    Route::get('/receipt/{booking}/pdf', 'exportReceiptPdf')->name('bookings.receipt.pdf');
});

// Authenticated User Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return redirect()->route('admin.dashboard');
    })->name('dashboard');
});

// Admin Routes
Route::middleware(['auth', 'verified', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::controller(UserController::class)
            ->prefix('users')
            ->name('users.')
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::put('/{user}', 'update')->name('update');
                Route::delete('/{user}', 'destroy')->name('destroy');
            });

        Route::controller(ResortOptionController::class)
            ->prefix('resort-options')
            ->name('resort-options.')
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::put('/{resortOption}', 'update')->name('update');
                Route::post('/{resortOption}/images', 'storeImage')->name('images.store');
            });

        Route::delete('/resort-option-images/{image}', [ResortOptionController::class, 'destroyImage'])
            ->name('resort-options.images.destroy');

        Route::controller(BookingController::class)
            ->prefix('bookings')
            ->name('bookings.')
            ->group(function () {
                Route::get('/', 'adminIndex')->name('index');
                Route::get('/{booking}', 'adminShow')->name('show');
                Route::patch('/{booking}/status', 'updateStatus')->name('update-status');
            });

        Route::controller(AdminLandingPageController::class)
            ->prefix('landing-page')
            ->name('landing-page.')
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/{section}', 'update')->name('update');
            });

        Route::controller(AdminCalendarController::class)
            ->prefix('calendar')
            ->name('calendar.')
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/bookings/{booking}', 'store')->name('store');
                Route::delete('/entries/{calendarEntry}', 'destroy')->name('destroy');
            });

        Route::controller(ReportController::class)
            ->prefix('reports')
            ->name('reports.')
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('/export/excel', 'exportExcel')->name('export.excel');
                Route::get('/export/pdf', 'exportPdf')->name('export.pdf');
            });

    });

require __DIR__.'/settings.php';
