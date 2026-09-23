<?php

use App\Http\Controllers\Api\Admin\AdminBackupController;
use App\Http\Controllers\Api\Admin\AdminExpenseController;
use App\Http\Controllers\Api\Admin\AdminIncomeController;
use App\Http\Controllers\Api\Admin\AdminInvoiceController;
use App\Http\Controllers\Api\Admin\AdminPaymentController;
use App\Http\Controllers\Api\Admin\AdminReportController;
use App\Http\Controllers\Api\Admin\AdminSettingController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\PropertyController as AdminPropertyController;
use App\Http\Controllers\Api\Admin\RoomController as AdminRoomController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Owner\OwnerBackupController;
use App\Http\Controllers\Api\Owner\BookingController as OwnerBookingController;
use App\Http\Controllers\Api\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Api\Owner\ExpenseController as OwnerExpenseController;
use App\Http\Controllers\Api\Owner\InvoiceController as OwnerInvoiceController;
use App\Http\Controllers\Api\Owner\PropertyController as OwnerPropertyController;
use App\Http\Controllers\Api\Owner\ReportController as OwnerReportController;
use App\Http\Controllers\Api\Owner\RoomController as OwnerRoomController;
use App\Http\Controllers\Api\Owner\StaffController as OwnerStaffController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PropertyController as PublicPropertyController;
use App\Http\Controllers\Api\RoomController as PublicRoomController;
use App\Http\Controllers\Api\Tenant\TenantInvoiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Pteas Yeung Platform API
*/

// ==========================================
// 🌐 1. Public Routes
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Google OAuth
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// Public Property & Room Catalog
Route::get('/properties', [PublicPropertyController::class, 'index']);
Route::get('/properties/{id}', [PublicPropertyController::class, 'show']);
Route::get('/rooms', [PublicRoomController::class, 'index']);
Route::get('/rooms/{id}', [PublicRoomController::class, 'show']);
Route::get('/rooms/{id}/availability', [PublicRoomController::class, 'checkAvailability']);
Route::post('/rooms/{id}/contact', [PublicRoomController::class, 'contactOwner']);

// System Settings (Public viewing)
Route::get('/admin/settings', [AdminSettingController::class, 'getSystemSettings']);
Route::get('/settings', [AdminSettingController::class, 'getSystemSettings']);

// ==========================================
// 🔒 2. Authenticated Routes (Sanctum)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // Current User & Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);
    Route::post('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::match(['put', 'post'], '/user/profile', [ProfileController::class, 'updateProfile']);
    Route::match(['put', 'post'], '/user/password', [ProfileController::class, 'updatePassword']);

    // Notifications (Admin, Owner, Tenant)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Tenant Bookings
    Route::apiResource('bookings', BookingController::class);

    // --------------------------------------------------
    // 👑 2.1 Super Admin Routes
    // --------------------------------------------------
    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::put('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
        Route::put('/users/{id}/role', [AdminUserController::class, 'changeRole']);
        Route::apiResource('users', AdminUserController::class);
        Route::apiResource('properties', AdminPropertyController::class);
        Route::apiResource('rooms', AdminRoomController::class);
        Route::apiResource('invoices', AdminInvoiceController::class);
        Route::apiResource('payments', AdminPaymentController::class);
        Route::post('/payments/collect/{id}', [AdminPaymentController::class, 'markCollected']);
        Route::apiResource('owner-payments', AdminPaymentController::class);
        Route::post('/owner-payments/collect/{id}', [AdminPaymentController::class, 'markCollected']);
        Route::get('/income', [AdminIncomeController::class, 'index']);
        Route::post('/income/collect/{id}', [AdminIncomeController::class, 'markCollected']);
        Route::apiResource('expenses', AdminExpenseController::class);
        Route::match(['put', 'post'], '/settings', [AdminSettingController::class, 'updateSystemSettings']);
        Route::get('/reports/export', [AdminReportController::class, 'export']);

        // 🛡️ Security & Audit Logs Telemetry
        Route::get('/audit-logs', [\App\Http\Controllers\Api\Admin\AuditLogController::class, 'index']);
        Route::get('/audit-logs/stats', [\App\Http\Controllers\Api\Admin\AuditLogController::class, 'stats']);
        Route::get('/audit-logs/{id}', [\App\Http\Controllers\Api\Admin\AuditLogController::class, 'show']);

        // 🔐 Permissions Management
        Route::get('/permissions', [\App\Http\Controllers\Api\Admin\PermissionController::class, 'index']);
        Route::get('/users/{id}/permissions', [\App\Http\Controllers\Api\Admin\PermissionController::class, 'getUserPermissions']);
        Route::put('/users/{id}/permissions', [\App\Http\Controllers\Api\Admin\PermissionController::class, 'updateUserPermissions']);

        // 💾 Data Backup & Disaster Recovery
        Route::get('/backup/stats', [AdminBackupController::class, 'stats']);
        Route::get('/backup/list', [AdminBackupController::class, 'index']);
        Route::post('/backup/create', [AdminBackupController::class, 'create']);
        Route::get('/backup/download/{filename}', [AdminBackupController::class, 'download']);
        Route::delete('/backup/{filename}', [AdminBackupController::class, 'destroy']);
        Route::get('/backup/export', [AdminBackupController::class, 'export']);
        Route::post('/backup/restore', [AdminBackupController::class, 'restore']);
    });

    // --------------------------------------------------
    // 🏡 2.2 Property Owner Routes
    // --------------------------------------------------
    Route::middleware('role:owner')->prefix('owner')->group(function () {
        Route::get('/dashboard', [OwnerDashboardController::class, 'index']);
        Route::get('/reports', [OwnerReportController::class, 'index']);
        Route::get('/reports/export', [OwnerReportController::class, 'export']);

        Route::apiResource('properties', OwnerPropertyController::class);
        Route::apiResource('rooms', OwnerRoomController::class);
        Route::delete('/room-images/{id}', [OwnerRoomController::class, 'deleteImage']);

        Route::apiResource('bookings', OwnerBookingController::class);
        Route::patch('/bookings/{id}/status', [OwnerBookingController::class, 'updateStatus']);

        Route::apiResource('invoices', OwnerInvoiceController::class);
        Route::get('/monthly-tracker', [OwnerInvoiceController::class, 'monthlyTracker']);
        Route::post('/monthly-tracker/remind/{id}', [OwnerInvoiceController::class, 'sendReminder']);
        Route::get('/monthly-tracker/export', [OwnerInvoiceController::class, 'exportMonthlyTracker']);
        Route::apiResource('expenses', OwnerExpenseController::class);
        Route::apiResource('staff', OwnerStaffController::class);
        Route::get('/staff/{id}/permissions', [OwnerStaffController::class, 'getStaffPermissions']);
        Route::put('/staff/{id}/permissions', [OwnerStaffController::class, 'updateStaffPermissions']);

        // 💾 Owner Data Backup & Export
        Route::get('/backup/stats', [OwnerBackupController::class, 'stats']);
        Route::get('/backup/list', [OwnerBackupController::class, 'index']);
        Route::post('/backup/create', [OwnerBackupController::class, 'create']);
        Route::get('/backup/download/{filename}', [OwnerBackupController::class, 'download']);
        Route::delete('/backup/{filename}', [OwnerBackupController::class, 'destroy']);
        Route::get('/backup/export', [OwnerBackupController::class, 'export']);
        Route::post('/backup/restore', [OwnerBackupController::class, 'restore']);
    });

    // --------------------------------------------------
    // 🛠️ 2.3 Staff Routes
    // --------------------------------------------------
    Route::middleware('role:staff')->prefix('staff')->group(function () {
        Route::get('/overview', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'overview']);
        Route::get('/properties', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'properties']);
        Route::get('/rooms', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'rooms']);
        Route::patch('/rooms/{id}/status', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'updateRoomStatus']);
        Route::get('/invoices', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'invoices']);
        Route::post('/invoices/{id}/collect', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'collectPayment']);
        Route::get('/bookings', [\App\Http\Controllers\Api\Staff\StaffPortalController::class, 'bookings']);
    });

    // --------------------------------------------------
    // 👤 2.4 Tenant Routes
    // --------------------------------------------------
    Route::middleware('role:tenant')->group(function () {
        Route::get('/my-bookings', [BookingController::class, 'myBookings']);
        Route::get('/my-invoices', [TenantInvoiceController::class, 'myInvoices']);
        Route::get('/my-invoices/{id}', [TenantInvoiceController::class, 'show']);
        Route::post('/my-invoices/{id}/pay', [TenantInvoiceController::class, 'pay']);
        Route::get('/my-monthly-payment', [TenantInvoiceController::class, 'currentMonthlyPayment']);
    });
});
