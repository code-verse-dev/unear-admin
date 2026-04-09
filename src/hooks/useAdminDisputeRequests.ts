import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  deleteDisputeRequest,
  disputeRequestDetailQueryKey,
  disputeRequestsListQueryKey,
  disputeRequestsQueryKeyRoot,
  getDisputeRequest,
  listDisputeRequests,
  updateDisputeRequest,
  type DisputeRequestsListParams,
  type UpdateDisputeRequestBody,
} from "@/api/disputeRequests";

export function useDisputeRequestsListQuery(params: DisputeRequestsListParams) {
  return useQuery({
    queryKey: disputeRequestsListQueryKey(params),
    queryFn: () => listDisputeRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useDisputeRequestDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: disputeRequestDetailQueryKey(id),
    queryFn: () => getDisputeRequest(id),
    enabled: enabled && id > 0,
  });
}

export function useUpdateDisputeRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDisputeRequestBody }) =>
      updateDisputeRequest(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeRequestsQueryKeyRoot });
    },
  });
}

export function useDeleteDisputeRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDisputeRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeRequestsQueryKeyRoot });
    },
  });
}
