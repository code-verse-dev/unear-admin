import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createFaq,
  deleteFaq,
  faqsListQueryKey,
  faqsQueryKeyRoot,
  listFaqs,
  updateFaq,
  type CreateFaqBody,
  type FaqsListParams,
  type UpdateFaqBody,
} from "@/api/adminFaqs";

export function useFaqsListQuery(params: FaqsListParams) {
  return useQuery({
    queryKey: faqsListQueryKey(params),
    queryFn: () => listFaqs(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateFaqMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFaqBody) => createFaq(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: faqsQueryKeyRoot });
    },
  });
}

export function useUpdateFaqMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateFaqBody }) => updateFaq(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: faqsQueryKeyRoot });
    },
  });
}

export function useDeleteFaqMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFaq(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: faqsQueryKeyRoot });
    },
  });
}
