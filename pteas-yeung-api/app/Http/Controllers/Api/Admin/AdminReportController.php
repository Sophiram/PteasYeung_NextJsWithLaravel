<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    // GET: /api/admin/reports/export
    public function export(Request $request)
    {
        // កូដសម្រាប់បង្កើត ឬទាញយកឯកសារ (Excel/PDF) ទៅតាមប្រភេទ report
        $type = $request->query('type', 'excel');

        return response()->json([
            'message' => 'កំពុងរៀបចំទាញយករបាយការណ៍ជាទម្រង់ ' . strtoupper($type)
        ]);
    }
}
