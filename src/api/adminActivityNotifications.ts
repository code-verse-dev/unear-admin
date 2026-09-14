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

export type ActivityNotificationsResult = {
  items: AdminActivityNotification[];
  pending_users: number;
};

export const ACTIVITY_BELL_LIMIT = 15;

export async function fetchActivityNotifications(limit = 30): Promise<ActivityNotificationsResult> {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  const json = await adminFetch<ApiSuccess<{ items?: AdminActivityNotification[]; pending_users?: number }>>(
    `/api/admin/activity-notifications?${q.toString()}`,
    { method: "GET", auth: true }
  );
  return {
    items: Array.isArray(json.data?.items) ? json.data.items : [],
    pending_users: Number(json.data?.pending_users) || 0,
  };
}
