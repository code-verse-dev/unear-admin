import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  deleteInspectionRequest,
  getInspectionRequest,
  inspectionRequestDetailQueryKey,
  inspectionRequestsListQueryKey,
  inspectionRequestsQueryKeyRoot,
  listInspectionRequests,
  updateInspectionRequest,
  type InspectionRequestsListParams,
  type UpdateInspectionRequestBody,
} from "@/api/inspectionRequests";

export function useInspectionRequestsListQuery(params: InspectionRequestsListParams) {
  return useQuery({
    queryKey: inspectionRequestsListQueryKey(params),
    queryFn: () => listInspectionRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useInspectionRequestDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: inspectionRequestDetailQueryKey(id),
    queryFn: () => getInspectionRequest(id),
    enabled: enabled && id > 0,
  });
}

export function useUpdateInspectionRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateInspectionRequestBody }) =>
      updateInspectionRequest(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionRequestsQueryKeyRoot });
    },
  });
}

export function useDeleteInspectionRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInspectionRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionRequestsQueryKeyRoot });
    },
  });
}
