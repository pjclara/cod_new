<?php

use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\Icd10CmController;
use App\Http\Controllers\Api\Icd10PcsController;
use App\Http\Controllers\Api\SpecialtyController;
use App\Http\Controllers\Api\SubspecialtyController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Specialties
    Route::get('specialties', [SpecialtyController::class, 'index'])->name('api.specialties.index');
    Route::get('specialties/{specialty}', [SpecialtyController::class, 'show'])->name('api.specialties.show');

    // Subspecialties (nested under specialty)
    Route::get('specialties/{specialty}/subspecialties', [SubspecialtyController::class, 'index'])->name('api.subspecialties.index');
    Route::get('subspecialties/{subspecialty}', [SubspecialtyController::class, 'show'])->name('api.subspecialties.show');

    // ICD-10-CM
    Route::get('icd10-cm', [Icd10CmController::class, 'index'])->name('api.icd10cm.index');
    Route::get('icd10-cm/search', [Icd10CmController::class, 'search'])->name('api.icd10cm.search');
    Route::get('icd10-cm/{icd10Cm}', [Icd10CmController::class, 'show'])->name('api.icd10cm.show');

    // ICD-10-PCS
    Route::get('icd10-pcs', [Icd10PcsController::class, 'index'])->name('api.icd10pcs.index');
    Route::get('icd10-pcs/search', [Icd10PcsController::class, 'search'])->name('api.icd10pcs.search');
    Route::get('icd10-pcs/structure', [Icd10PcsController::class, 'structure'])->name('api.icd10pcs.structure');
    Route::get('icd10-pcs/{icd10Pcs}', [Icd10PcsController::class, 'show'])->name('api.icd10pcs.show');

    // Assign subspecialty (auth required)
    Route::middleware('auth:web')->group(function () {
        Route::patch('icd10-cm/bulk-assign', [Icd10CmController::class, 'bulkAssign'])->name('api.icd10cm.bulkAssign');
        Route::patch('icd10-cm/{icd10Cm}/assign', [Icd10CmController::class, 'assign'])->name('api.icd10cm.assign');
        Route::patch('icd10-pcs/bulk-assign', [Icd10PcsController::class, 'bulkAssign'])->name('api.icd10pcs.bulkAssign');
        Route::patch('icd10-pcs/{icd10Pcs}/assign', [Icd10PcsController::class, 'assign'])->name('api.icd10pcs.assign');
    });

    // Favorites (auth required)
    Route::middleware('auth:web')->group(function () {
        Route::apiResource('favorites', FavoriteController::class)->only(['index', 'store', 'destroy'])->names([
            'index'   => 'api.favorites.index',
            'store'   => 'api.favorites.store',
            'destroy' => 'api.favorites.destroy',
        ]);
    });
});
