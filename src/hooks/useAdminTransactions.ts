import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getTransaction,
  listTransactions,
  transactionDetailQueryKey,
  transactionsListQueryKey,
  type TransactionsListParams,
} from "@/api/transactions";

export function useTransactionsListQuery(params: TransactionsListParams) {
  return useQuery({
    queryKey: transactionsListQueryKey(params),
    queryFn: () => listTransactions(params),
    placeholderData: keepPreviousData,
  });
}

export function useTransactionDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: transactionDetailQueryKey(id),
    queryFn: () => getTransaction(id),
    enabled: enabled && id > 0,
  });
}
