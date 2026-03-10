<?php

use App\Http\Controllers\Icd\IcdController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

// ── ICD-10 Pages ──────────────────────────────────────────────────────────────
// Browsing is public. Favorites require auth (enforced at API level).

Route::prefix('icd')->name('icd.')->controller(IcdController::class)->group(function () {
    Route::get('',                                       'index')->name('home');
    Route::inertia('specialties',                        'icd/specialties')->name('specialties');
    Route::get('specialties/{specialty}/subspecialties', 'subspecialties')->name('subspecialties');
    Route::get('cm',                                     'cmIndex')->name('cm.index');
    Route::get('cm/{code}',                              'cmShow')->name('cm.show');
    Route::get('pcs',                                    'pcsIndex')->name('pcs.index');
    Route::get('pcs/{code}',                             'pcsShow')->name('pcs.show');

    Route::middleware(['auth', 'verified'])->group(function () {
        Route::inertia('favorites', 'icd/favorites')->name('favorites');
    });
});

require __DIR__.'/settings.php';
