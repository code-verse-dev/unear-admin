import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSupportTicket,
  getSupportTicketMessages,
  sendSupportTicketMessage,
  supportTicketMessagesQueryKey,
  supportTicketMessagesQueryKeyRoot,
  type SupportChatRoom,
  type SupportTicketKind,
} from "@/api/supportTicketChat";
import { damageTicketsQueryKeyRoot, damageTicketDetailQueryKey } from "@/api/damageTickets";
import { disputeRequestsQueryKeyRoot, disputeRequestDetailQueryKey } from "@/api/disputeRequests";
import { bookingInvoicesQueryKeyRoot, bookingInvoiceDetailQueryKey } from "@/api/bookingInvoices";

export function useSupportTicketMessagesQuery(
  kind: SupportTicketKind,
  id: number,
  room: SupportChatRoom,
  enabled: boolean
) {
  return useQuery({
    queryKey: supportTicketMessagesQueryKey(kind, id, room),
    queryFn: () => getSupportTicketMessages(kind, id, room),
    enabled: enabled && id > 0,
    refetchInterval: enabled ? 8000 : false,
  });
}

export function useSendSupportTicketMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      id,
      room,
      message,
    }: {
      kind: SupportTicketKind;
      id: number;
      room: SupportChatRoom;
      message: string;
    }) => sendSupportTicketMessage(kind, id, { room, message }),
    onSuccess: (_data, { kind, id, room }) => {
      qc.invalidateQueries({ queryKey: supportTicketMessagesQueryKey(kind, id, room) });
      if (kind === "damage") {
        qc.invalidateQueries({ queryKey: damageTicketDetailQueryKey(id) });
        qc.invalidateQueries({ queryKey: damageTicketsQueryKeyRoot });
      }
      if (kind === "dispute") {
        qc.invalidateQueries({ queryKey: disputeRequestDetailQueryKey(id) });
        qc.invalidateQueries({ queryKey: disputeRequestsQueryKeyRoot });
      }
      if (kind === "extras") {
        qc.invalidateQueries({ queryKey: bookingInvoiceDetailQueryKey(id) });
        qc.invalidateQueries({ queryKey: bookingInvoicesQueryKeyRoot });
      }
    },
  });
}

export function useDeleteSupportTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: SupportTicketKind; id: number }) =>
      deleteSupportTicket(kind, id),
    onSuccess: (_data, { kind, id }) => {
      qc.invalidateQueries({ queryKey: supportTicketMessagesQueryKeyRoot });
      if (kind === "damage") {
        qc.removeQueries({ queryKey: damageTicketDetailQueryKey(id) });
        qc.invalidateQueries({ queryKey: damageTicketsQueryKeyRoot });
      }
      if (kind === "dispute") {
        qc.removeQueries({ queryKey: disputeRequestDetailQueryKey(id) });
        qc.invalidateQueries({ queryKey: disputeRequestsQueryKeyRoot });
      }
      if (kind === "extras") {
        qc.removeQueries({ queryKey: bookingInvoiceDetailQueryKey(id) });
        qc.invalidateQueries({ queryKey: bookingInvoicesQueryKeyRoot });
      }
    },
  });
}
