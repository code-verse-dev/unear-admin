import { useQuery } from "@tanstack/react-query";
import { fetchActivityNotifications, type AdminActivityNotification } from "@/api/adminActivityNotifications";

export const activityNotificationsQueryKey = (limit: number) => ["admin", "activity-notifications", limit] as const;

export function useAdminActivityNotificationsQuery(limit = 30) {
  return useQuery({
    queryKey: activityNotificationsQueryKey(limit),
    queryFn: () => fetchActivityNotifications(limit),
    staleTime: 30_000,
  });
}

export type { AdminActivityNotification };
