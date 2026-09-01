import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSupportTicket,
  getSupportTicketMessages,
  sendSupportTicketMessage,
  supportTicketMessagesQueryKey,
  supportTicketMessagesQueryKeyRoot,
  type SupportChatRoom,
  type SupportTicketKind,
  type SupportTicketMessage,
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
    onSuccess: (data, { kind, id, room }) => {
      const key = supportTicketMessagesQueryKey(kind, id, room);
      qc.setQueryData(key, (old: { messages?: SupportTicketMessage[] } | undefined) => {
        const messages = Array.isArray(old?.messages) ? old.messages : [];
        if (data?.message_id && messages.some((m) => m.message_id === data.message_id)) {
          return old;
        }
        return {
          ...(old || { kind, ticket_id: id, room, chat_room_id: data?.chat_room_id, pagination: { page: 1, limit: 100, total: 0 }, messages: [] }),
          messages: [...messages, data],
        };
      });
      void qc.invalidateQueries({ queryKey: key });
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
