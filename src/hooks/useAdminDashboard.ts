import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/api/adminDashboard";

export const adminDashboardQueryKey = ["admin", "dashboard"] as const;

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: getAdminDashboard,
    staleTime: 60_000,
  });
}
