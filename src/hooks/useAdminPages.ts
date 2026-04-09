import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createPage,
  deletePage,
  listPages,
  pagesListQueryKey,
  pagesQueryKeyRoot,
  updatePage,
  type CreatePageBody,
  type PagesListParams,
  type UpdatePageBody,
} from "@/api/adminPages";

export function usePagesListQuery(params: PagesListParams) {
  return useQuery({
    queryKey: pagesListQueryKey(params),
    queryFn: () => listPages(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePageBody) => createPage(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pagesQueryKeyRoot });
    },
  });
}

export function useUpdatePageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdatePageBody }) => updatePage(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pagesQueryKeyRoot });
    },
  });
}

export function useDeletePageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pagesQueryKeyRoot });
    },
  });
}
