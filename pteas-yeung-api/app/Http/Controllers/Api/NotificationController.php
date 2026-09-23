<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get list of notifications and unread count for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if user has zero notifications, seed role-appropriate welcome notifications
        $count = Notification::forUser($user)->count();
        if ($count === 0) {
            $this->seedInitialNotifications($user);
        }

        $unreadCount = Notification::forUser($user)
            ->where('is_read', false)
            ->count();

        $notifications = Notification::forUser($user)
            ->latest()
            ->limit(40)
            ->get();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::forUser($user)->find($id);

        if (! $notification) {
            return response()->json([
                'success' => false,
                'message' => 'រកមិនឃើញការជូនដំណឹងនេះឡើយ',
            ], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'បានកត់សម្គាល់ថាបានអានរួច',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read for the user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::forUser($user)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'បានកត់សម្គាល់ទាំងអស់ថាបានអានរួច',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::forUser($user)->find($id);

        if ($notification) {
            $notification->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'បានលុបការជូនដំណឹងដោយជោគជ័យ',
        ]);
    }

    /**
     * Seed friendly initial sample notifications based on user role.
     */
    private function seedInitialNotifications($user): void
    {
        $role = strtolower($user->role);

        if ($role === 'super_admin' || $role === 'admin') {
            Notification::sendToUser(
                $user->id,
                'ស្វាគមន៍មកកាន់ Admin Control Center',
                'ប្រព័ន្ធ PteasYeung Platform បានដំឡើង និងដំណើរការជាធម្មតា។ អ្នកអាចគ្រប់គ្រងអ្នកប្រើប្រាស់ អចលនទ្រព្យ និងការកំណត់ប្រព័ន្ធទាំងមូលនៅទីនេះ។',
                'system',
                '/dashboard/admin/settings'
            );
            Notification::sendToUser(
                $user->id,
                'ការកក់បន្ទប់ថ្មីក្នុងប្រព័ន្ធ',
                'មានការស្នើសុំកក់បន្ទប់ថ្មីត្រូវបានចុះឈ្មោះក្នុងប្រព័ន្ធ។ សូមពិនិត្យមើលផ្ទាំងគ្រប់គ្រងទូទៅ។',
                'booking',
                '/dashboard/admin'
            );
        } elseif ($role === 'owner') {
            Notification::sendToUser(
                $user->id,
                'ស្វាគមន៍មកកាន់ផ្ទាំងគ្រប់គ្រងម្ចាស់ផ្ទះ (Owner Panel)',
                'លោកអ្នកអាចគ្រប់គ្រងអគារ បន្ទប់ជួល ពិនិត្យការកក់ និងតាមដានវិក្កយបត្រភ្លើង-ទឹកបានយ៉ាងងាយស្រួល។',
                'system',
                '/dashboard/owner'
            );
            Notification::sendToUser(
                $user->id,
                'ការកក់បន្ទប់រង់ចាំការបញ្ជាក់',
                'មានអ្នកជួលបានស្នើសុំកក់បន្ទប់ជួលរបស់អ្នក។ សូមចូលទៅកាន់ផ្ទាំងគ្រប់គ្រងការកក់ដើម្បីពិនិត្យ និងយល់ព្រម។',
                'booking',
                '/dashboard/owner/bookings'
            );
            Notification::sendToUser(
                $user->id,
                'រៀបចំប្រព័ន្ធគណនាវិក្កយបត្រ',
                'កុំភ្លេចពិនិត្យ និងកត់ត្រាតម្លៃភ្លើង-ទឹកប្រចាំខែ ដើម្បីចេញវិក្កយបត្រជូនអ្នកជួលឱ្យបានទាន់ពេលវេលា។',
                'invoice',
                '/dashboard/owner/invoices'
            );
        } else {
            // Tenant
            Notification::sendToUser(
                $user->id,
                'ស្វាគមន៍មកកាន់ PteasYeung!',
                'គណនីរបស់អ្នកបានបង្កើតដោយជោគជ័យ។ អ្នកអាចស្វែងរកបន្ទប់ជួល តាមដានការកក់ និងមើលវិក្កយបត្ររបស់អ្នកបានគ្រប់ពេល។',
                'system',
                '/dashboard/tenant/bookings'
            );
            Notification::sendToUser(
                $user->id,
                'កុំភ្លេចបំពេញប្រវត្តិរូបផ្ទាល់ខ្លួន',
                'សូមចូលទៅកាន់ Profile របស់អ្នកដើម្បីបន្ថែមរូបភាពគណនី លេខទូរស័ព្ទ និងលេខអត្តសញ្ញាណប័ណ្ណដើម្បីងាយស្រួលក្នុងការកក់បន្ទប់។',
                'profile',
                '/dashboard/tenant/profile'
            );
        }
    }
}
