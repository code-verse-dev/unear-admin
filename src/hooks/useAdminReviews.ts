import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  deleteReview,
  getReview,
  listReviews,
  reviewDetailQueryKey,
  reviewsListQueryKey,
  reviewsQueryKeyRoot,
  updateReview,
  type ReviewsListParams,
  type UpdateReviewBody,
} from "@/api/reviews";

export function useReviewsListQuery(params: ReviewsListParams) {
  return useQuery({
    queryKey: reviewsListQueryKey(params),
    queryFn: () => listReviews(params),
    placeholderData: keepPreviousData,
  });
}

export function useReviewDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: reviewDetailQueryKey(id),
    queryFn: () => getReview(id),
    enabled: enabled && id > 0,
  });
}

export function useUpdateReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateReviewBody }) => updateReview(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewsQueryKeyRoot });
    },
  });
}

export function useDeleteReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewsQueryKeyRoot });
    },
  });
}
