import { useQuery } from "@tanstack/react-query";
import {
  fetchActivityNotifications,
  type AdminActivityNotification,
  type ActivityNotificationsResult,
} from "@/api/adminActivityNotifications";

export const activityNotificationsQueryKeyRoot = ["admin", "activity-notifications"] as const;

export const activityNotificationsQueryKey = (limit: number) =>
  [...activityNotificationsQueryKeyRoot, limit] as const;

export function useAdminActivityNotificationsQuery(limit = 30) {
  return useQuery({
    queryKey: activityNotificationsQueryKey(limit),
    queryFn: () => fetchActivityNotifications(limit),
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export type { AdminActivityNotification, ActivityNotificationsResult };
