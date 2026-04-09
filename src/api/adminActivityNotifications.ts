import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

export type AdminActivityKind =
  | "user_registered"
  | "dispute_submitted"
  | "inspection_request"
  | "expense_claim"
  | "vehicle_listed";

export type AdminActivityNotification = {
  id: string;
  kind: AdminActivityKind;
  title: string;
  message: string;
  created_at: string;
  path: string;
  ref_id: number;
};

export async function fetchActivityNotifications(limit = 30): Promise<AdminActivityNotification[]> {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  const json = await adminFetch<ApiSuccess<{ items: AdminActivityNotification[] }>>(
    `/api/admin/activity-notifications?${q.toString()}`,
    { method: "GET", auth: true }
  );
  return json.data.items ?? [];
}
