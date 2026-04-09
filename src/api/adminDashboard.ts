import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

export type DashboardStats = {
  total_users: number;
  total_listed_vehicles: number;
  total_rented_vehicles: number;
  total_sold_vehicles: number;
  total_bookings: number;
  total_rental_commission: number;
  total_purchase_commission: number;
  total_inspection_earning: number;
  pending_disputes: number;
  open_inspections: number;
  pending_expense_claims: number;
  new_users_30d: number;
  new_bookings_30d: number;
  new_users_prev_30d: number;
  new_bookings_prev_30d: number;
  new_vehicles_30d: number;
  new_vehicles_prev_30d: number;
  period_revenue_30d: number;
  period_revenue_prev_30d: number;
};

export type DashboardMonthlyRow = {
  month: string;
  total?: number | string;
  total_purchases?: number | string;
};

export type DashboardGraphData = {
  purchaseGraph: DashboardMonthlyRow[];
  rentalGraph: DashboardMonthlyRow[];
  usersByMonth: DashboardMonthlyRow[];
  bookingsByMonth: DashboardMonthlyRow[];
};

export type DashboardActivityItem = {
  id: string;
  kind: string;
  title: string;
  message: string;
  created_at: string;
  path: string;
  ref_id: number;
};

export type AdminDashboardData = {
  dashboardStats: DashboardStats;
  dashboardGraphData: DashboardGraphData;
  recent_activity: DashboardActivityItem[];
};

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const json = await adminFetch<ApiSuccess<AdminDashboardData>>("/api/admin/dashboard", {
    method: "GET",
    auth: true,
  });
  return json.data;
}
