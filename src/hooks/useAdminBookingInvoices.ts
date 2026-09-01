import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  bookingInvoiceDetailQueryKey,
  bookingInvoicesListQueryKey,
  bookingInvoicesQueryKeyRoot,
  getBookingInvoice,
  listBookingInvoices,
  updateBookingInvoice,
  type BookingInvoicesListParams,
  type UpdateBookingInvoiceBody,
} from "@/api/bookingInvoices";

export function useBookingInvoicesListQuery(params: BookingInvoicesListParams) {
  return useQuery({
    queryKey: bookingInvoicesListQueryKey(params),
    queryFn: () => listBookingInvoices(params),
    placeholderData: keepPreviousData,
  });
}

export function useBookingInvoiceDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: bookingInvoiceDetailQueryKey(id),
    queryFn: () => getBookingInvoice(id),
    enabled: enabled && id > 0,
  });
}

export function useUpdateBookingInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateBookingInvoiceBody }) =>
      updateBookingInvoice(id, body),
    onSuccess: (data, { id }) => {
      qc.setQueryData(bookingInvoiceDetailQueryKey(id), data);
      qc.invalidateQueries({ queryKey: bookingInvoicesQueryKeyRoot });
    },
  });
}
