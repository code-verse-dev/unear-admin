import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  approveExpenseClaim,
  expenseClaimDetailQueryKey,
  expenseClaimsListQueryKey,
  expenseClaimsQueryKeyRoot,
  getExpenseClaim,
  listExpenseClaims,
  markExpenseClaimPaid,
  rejectExpenseClaim,
  updateExpenseClaim,
  type ExpenseClaimsListParams,
  type UpdateExpenseClaimBody,
} from "@/api/expenseClaims";

export function useExpenseClaimsListQuery(params: ExpenseClaimsListParams) {
  return useQuery({
    queryKey: expenseClaimsListQueryKey(params),
    queryFn: () => listExpenseClaims(params),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseClaimDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: expenseClaimDetailQueryKey(id),
    queryFn: () => getExpenseClaim(id),
    enabled: enabled && id > 0,
  });
}

export function useApproveExpenseClaimMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_notes }: { id: number; admin_notes?: string | null }) =>
      approveExpenseClaim(id, { admin_notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseClaimsQueryKeyRoot });
    },
  });
}

export function useRejectExpenseClaimMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_notes }: { id: number; admin_notes?: string | null }) =>
      rejectExpenseClaim(id, { admin_notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseClaimsQueryKeyRoot });
    },
  });
}

export function useMarkExpenseClaimPaidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, admin_notes }: { id: number; admin_notes?: string | null }) =>
      markExpenseClaimPaid(id, { admin_notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseClaimsQueryKeyRoot });
    },
  });
}

export function useUpdateExpenseClaimMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateExpenseClaimBody }) => updateExpenseClaim(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseClaimsQueryKeyRoot });
    },
  });
}
