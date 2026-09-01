import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { DamageTicketMessage } from "@/api/damageTickets";

export type SupportTicketKind = "dispute" | "damage" | "extras";
export type SupportChatRoom = "user" | "host" | "guest";

export type SupportTicketMessage = DamageTicketMessage;

export type SupportTicketMessagesResult = {
  kind: SupportTicketKind;
  ticket_id: number;
  room: SupportChatRoom;
  chat_room_id: number;
  pagination: { page: number; limit: number; total: number };
  messages: SupportTicketMessage[];
};

export async function getSupportTicketMessages(
  kind: SupportTicketKind,
  id: number,
  room: SupportChatRoom,
  page = 1,
  limit = 100
): Promise<SupportTicketMessagesResult> {
  const sp = new URLSearchParams({
    room,
    page: String(page),
    limit: String(limit),
  });
  const json = await adminFetch<ApiSuccess<SupportTicketMessagesResult>>(
    `/api/admin/support-ticket/${kind}/${id}/messages?${sp.toString()}`,
    { method: "GET", auth: true }
  );
  return json.data;
}

export async function sendSupportTicketMessage(
  kind: SupportTicketKind,
  id: number,
  body: { room: SupportChatRoom; message: string }
): Promise<SupportTicketMessage> {
  const json = await adminFetch<ApiSuccess<SupportTicketMessage>>(
    `/api/admin/support-ticket/${kind}/${id}/messages`,
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export async function deleteSupportTicket(kind: SupportTicketKind, id: number): Promise<void> {
  await adminFetch<ApiSuccess<{ kind: SupportTicketKind; id: number }>>(
    `/api/admin/support-ticket/${kind}/${id}`,
    { method: "DELETE", auth: true }
  );
}

export const supportTicketMessagesQueryKeyRoot = ["admin", "support-ticket-messages"] as const;

export function supportTicketMessagesQueryKey(
  kind: SupportTicketKind,
  id: number,
  room: SupportChatRoom
) {
  return [...supportTicketMessagesQueryKeyRoot, kind, id, room] as const;
}
