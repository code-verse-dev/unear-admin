import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeAdminPassword,
  getAdminMyProfile,
  patchAdminProfile,
  type AdminMyProfile,
} from "@/api/adminProfile";
import { getAdminSession, setAdminSession } from "@/lib/auth-session";

export const adminProfileQueryKey = ["admin", "my-profile"] as const;

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: adminProfileQueryKey,
    queryFn: getAdminMyProfile,
  });
}

function mergeSessionFromProfile(data: AdminMyProfile) {
  const s = getAdminSession();
  if (!s) return;
  setAdminSession({
    ...s,
    name: data.name ?? s.name,
    firstname: data.firstname ?? s.firstname,
    lastname: data.lastname ?? s.lastname,
    image_url: data.image_url || s.image_url,
  });
}

export function usePatchAdminProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchAdminProfile,
    onSuccess: (data) => {
      mergeSessionFromProfile(data);
      void qc.invalidateQueries({ queryKey: adminProfileQueryKey });
    },
  });
}

export function useChangeAdminPasswordMutation() {
  return useMutation({
    mutationFn: changeAdminPassword,
  });
}
