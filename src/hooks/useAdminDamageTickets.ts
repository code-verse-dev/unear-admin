import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  chargeDamageTicket,
  damageTicketDetailQueryKey,
  damageTicketMessagesQueryKey,
  damageTicketsListQueryKey,
  damageTicketsQueryKeyRoot,
  getDamageTicket,
  getDamageTicketMessages,
  listDamageTickets,
  sendDamageTicketMessage,
  updateDamageTicket,
  type DamageTicketsListParams,
  type UpdateDamageTicketBody,
} from "@/api/damageTickets";

export function useDamageTicketsListQuery(params: DamageTicketsListParams) {
  return useQuery({
    queryKey: damageTicketsListQueryKey(params),
    queryFn: () => listDamageTickets(params),
    placeholderData: keepPreviousData,
  });
}

export function useDamageTicketDetailQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: damageTicketDetailQueryKey(id),
    queryFn: () => getDamageTicket(id),
    enabled: enabled && id > 0,
  });
}

export function useDamageTicketMessagesQuery(
  id: number,
  room: "host" | "guest",
  enabled: boolean
) {
  return useQuery({
    queryKey: damageTicketMessagesQueryKey(id, room),
    queryFn: () => getDamageTicketMessages(id, room),
    enabled: enabled && id > 0,
    refetchInterval: enabled ? 8000 : false,
  });
}

export function useUpdateDamageTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDamageTicketBody }) =>
      updateDamageTicket(id, body),
    onSuccess: (data, { id }) => {
      qc.setQueryData(damageTicketDetailQueryKey(id), data);
      qc.invalidateQueries({ queryKey: damageTicketsQueryKeyRoot });
    },
  });
}

export function useChargeDamageTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body?: { final_amount?: number; wallet_amount?: number; admin_notes?: string | null };
    }) => chargeDamageTicket(id, body || {}),
    onSuccess: (data, { id }) => {
      qc.setQueryData(damageTicketDetailQueryKey(id), data);
      qc.invalidateQueries({ queryKey: damageTicketsQueryKeyRoot });
    },
  });
}

export function useSendDamageTicketMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      room,
      message,
    }: {
      id: number;
      room: "host" | "guest";
      message: string;
    }) => sendDamageTicketMessage(id, { room, message }),
    onSuccess: (_data, { id, room }) => {
      qc.invalidateQueries({ queryKey: damageTicketMessagesQueryKey(id, room) });
      qc.invalidateQueries({ queryKey: damageTicketDetailQueryKey(id) });
      qc.invalidateQueries({ queryKey: damageTicketsQueryKeyRoot });
    },
  });
}
