import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminSetting,
  patchAdminSetting,
  type AdminSettingUpdate,
} from "@/api/adminSettings";

export const adminSettingQueryKey = ["admin", "setting"] as const;

export function useAdminSettingQuery() {
  return useQuery({
    queryKey: adminSettingQueryKey,
    queryFn: getAdminSetting,
  });
}

export function usePatchAdminSettingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AdminSettingUpdate }) =>
      patchAdminSetting(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSettingQueryKey });
    },
  });
}
