import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

export type SupportTicketKind = "extras" | "claim" | "general";
export type SupportChatRoom = "user" | "host" | "guest";

export type SupportTicketMessage = {
  chat_room_id: number;
  message_id: number;
  message_type: string;
  message: string;
  file_url?: string | string[] | null;
  file_name?: string | null;
  user_id: number;
  user_name?: string;
  user_image?: string | string[] | null;
  user_type?: string | null;
  message_timestamp: string;
};

export type SupportTicketMessagesResult = {
  kind: SupportTicketKind;
  ticket_id: number;
  room: SupportChatRoom;
  chat_room_id: number;
  pagination: { page: number; limit: number; total: number };
  messages: SupportTicketMessage[];
};

function messagesUrl(kind: SupportTicketKind, id: number, query = "") {
  if (kind === "claim" || kind === "general") {
    return `/api/admin/unified-ticket/${id}/messages${query}`;
  }
  return `/api/admin/support-ticket/extras/${id}/messages${query}`;
}

function deleteUrl(kind: SupportTicketKind, id: number) {
  if (kind === "claim" || kind === "general") {
    return `/api/admin/unified-ticket/${id}`;
  }
  return `/api/admin/support-ticket/extras/${id}`;
}

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
    messagesUrl(kind, id, `?${sp.toString()}`),
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
    messagesUrl(kind, id),
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export async function deleteSupportTicket(kind: SupportTicketKind, id: number): Promise<void> {
  await adminFetch<ApiSuccess<{ kind: SupportTicketKind; id: number }>>(deleteUrl(kind, id), {
    method: "DELETE",
    auth: true,
  });
}

export const supportTicketMessagesQueryKeyRoot = ["admin", "support-ticket-messages"] as const;

export function supportTicketMessagesQueryKey(
  kind: SupportTicketKind,
  id: number,
  room: SupportChatRoom
) {
  return [...supportTicketMessagesQueryKeyRoot, kind, id, room] as const;
}
