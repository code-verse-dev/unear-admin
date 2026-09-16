import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createHostChargeType,
  deleteHostChargeType,
  hostChargeTypesListQueryKey,
  hostChargeTypesQueryKeyRoot,
  listHostChargeTypes,
  updateHostChargeType,
  type HostChargeTypeBody,
  type HostChargeTypesListParams,
} from "@/api/adminHostChargeTypes";

export function useHostChargeTypesListQuery(params: HostChargeTypesListParams) {
  return useQuery({
    queryKey: hostChargeTypesListQueryKey(params),
    queryFn: () => listHostChargeTypes(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateHostChargeTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: HostChargeTypeBody) => createHostChargeType(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostChargeTypesQueryKeyRoot });
    },
  });
}

export function useUpdateHostChargeTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: HostChargeTypeBody }) =>
      updateHostChargeType(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostChargeTypesQueryKeyRoot });
    },
  });
}

export function useDeleteHostChargeTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteHostChargeType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostChargeTypesQueryKeyRoot });
    },
  });
}
