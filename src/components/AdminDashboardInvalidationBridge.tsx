import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminDashboardQueryKey } from "@/hooks/useAdminDashboard";
import { activityNotificationsQueryKeyRoot } from "@/hooks/useAdminActivityNotifications";

/**
 * Refetches dashboard stats/charts/activity whenever any React Query mutation succeeds
 * (admin hooks: users, vehicles, settings, push, etc.). Login uses fetch, not mutations.
 */
export function AdminDashboardInvalidationBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== "updated") return;
      const mutation = event.mutation;
      if (!mutation || mutation.state.status !== "success") return;
      if (mutation.meta?.skipAdminDashboardInvalidation) return;
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey });
      void queryClient.invalidateQueries({ queryKey: activityNotificationsQueryKeyRoot });
    });
  }, [queryClient]);

  return null;
}
