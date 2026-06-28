<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\RoomController;

// Public Controllers
use App\Http\Controllers\Api\PropertyController as PublicPropertyController;
use App\Http\Controllers\Api\RoomController as PublicRoomController;

// Super Admin Controllers
use App\Http\Controllers\Api\Admin\AdminExpenseController;
use App\Http\Controllers\Api\Admin\AdminInvoiceController;
use App\Http\Controllers\Api\Admin\AdminReportController;
use App\Http\Controllers\Api\Admin\AdminSettingController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\PropertyController as AdminPropertyController;

// Owner Controllers
use App\Http\Controllers\Api\Owner\DashboardController;
use App\Http\Controllers\Api\Owner\PropertyController as OwnerPropertyController;
use App\Http\Controllers\Api\Owner\RoomController as OwnerRoomController;
use App\Http\Controllers\Api\Owner\BookingController as OwnerBookingController;
use App\Http\Controllers\Api\Owner\InvoiceController;
use App\Http\Controllers\Api\Owner\ExpenseController;
use App\Http\Controllers\Api\Owner\StaffController;
use App\Http\Controllers\Api\Owner\ReportController;

// ==========================================
// 🌐 ១. ផ្លូវសាធារណៈ (Public Routes)
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('properties', [PublicPropertyController::class, 'index']);
Route::get('properties/{id}', [PublicPropertyController::class, 'show']);
Route::get('rooms', [PublicRoomController::class, 'index']);
Route::get('rooms/{id}', [PublicRoomController::class, 'show']);
Route::get('rooms/{id}/availability', [PublicRoomController::class, 'checkAvailability']);

Route::get('admin/settings', [AdminSettingController::class, 'getSystemSettings']);

// ==========================================
// 🔒 ២. ផ្លូវដែលត្រូវ Login (Sanctum Protected)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile ទូទៅ
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);
    Route::post('/profile/password', [ProfileController::class, 'updatePassword']);

    // Global Resource (សម្រាប់ Tenant ឬ តួនាទីទូទៅ)
    Route::apiResource('bookings', BookingController::class);

    // 👑 ២.១. SUPER ADMIN
    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::put('users/{id}/status', [AdminUserController::class, 'updateStatus']);
        Route::put('users/{id}/role', [AdminUserController::class, 'changeRole']);
        Route::apiResource('users', AdminUserController::class);
        Route::apiResource('properties', AdminPropertyController::class);
        Route::apiResource('rooms', RoomController::class);
        Route::apiResource('invoices', AdminInvoiceController::class);
        Route::apiResource('expenses', AdminExpenseController::class);
        Route::put('settings', [AdminSettingController::class, 'updateSystemSettings']);
        Route::get('reports/export', [AdminReportController::class, 'export']);
    });

    // 🏡 ២.២. OWNER (បានថែម prefix('owner') ដើម្បីកុំឱ្យជាន់ផ្លូវសាធារណៈ)
    Route::middleware('role:owner')->prefix('owner')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/export', [ReportController::class, 'export']);

        Route::apiResources([
            'bookings' => OwnerBookingController::class,
            'invoices' => InvoiceController::class,
            'expenses' => ExpenseController::class,
            'staff'    => StaffController::class,
        ]);

        Route::apiResource('properties', OwnerPropertyController::class);
        Route::apiResource('rooms', OwnerRoomController::class);
    });

    // 🛠️ ២.៣. STAFF
    Route::middleware('role:staff')->group(function () {
        Route::post('/rooms/check-status', [RoomController::class, 'updateStatus']);
    });

    // 👤 ២.៤. TENANT (អ្នកជួល)
    Route::middleware('role:tenant')->group(function () {
        Route::get('/my-bookings', [BookingController::class, 'myBookings']);
        Route::get('/my-invoices', [InvoiceController::class, 'myInvoices']);
    });
});
