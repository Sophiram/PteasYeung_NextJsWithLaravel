// types/dashboard.ts

export interface AdminDashboardStats {
  total_users: number;
  total_owners: number;
  total_tenants: number;
  total_staff: number;
  total_properties: number;
  total_rooms: number;
  active_bookings: number;
  total_revenue: number;
  total_expenses: number;
}

export interface AdminDashboardChartData {
  donut: {
    series: number[];
    labels: string[];
  };
  weekly: {
    categories: string[];
    values: number[];
    is_sample?: boolean;
  };
}

export interface AdminDashboardResponse {
  success: boolean;
  stats: AdminDashboardStats;
  chart_data: AdminDashboardChartData;
  latest_data: {
    recent_users: Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
      created_at: string;
    }>;
    recent_invoices: Array<{
      id: number;
      total_amount: string | number;
      payment_status: string;
      booking?: {
        tenant?: { id: number; name: string; email: string };
        room?: { id: number; room_number: string };
      };
    }>;
    recent_properties: Array<{
      id: number;
      title: string;
      owner?: { id: number; name: string; email: string };
    }>;
  };
  system_info: {
    server_time: string;
    app_version: string;
  };
}

// Owner dashboard
export interface OwnerDashboardStats {
  total_properties: number;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  maintenance_rooms: number;
  total_bookings: number;
  total_revenue: number;
  total_expense: number;
  net_profit: number;
}

export interface OwnerBarChartItem {
  name: string;
  revenue: number;
  expense: number;
}

export interface OwnerDonutChartItem {
  property_name: string;
  rooms_count: number;
}

export interface OwnerDashboardResponse {
  success: boolean;
  properties: Array<{ id: number; name: string }>;
  stats: OwnerDashboardStats;
  bar_chart: OwnerBarChartItem[];
  donut_chart: OwnerDonutChartItem[];
}

export interface OwnerDashboardParams {
  property_id?: string;
  month?: string;
  year?: string;
}
