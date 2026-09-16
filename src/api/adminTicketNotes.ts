import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { SupportTicketKind } from "@/api/supportTicketChat";

export type AdminTicketNote = {
  id: number;
  kind: SupportTicketKind;
  ticket_id: number;
  body: string;
  creator_id: number;
  creator_name: string;
  created_at: string;
  can_delete: boolean;
};

function notesUrl(kind: SupportTicketKind, id: number, noteId?: number) {
  const base = `/api/admin/support-ticket/${kind}/${id}/notes`;
  return noteId != null ? `${base}/${noteId}` : base;
}

export async function listAdminTicketNotes(kind: SupportTicketKind, id: number): Promise<AdminTicketNote[]> {
  const json = await adminFetch<ApiSuccess<AdminTicketNote[]>>(notesUrl(kind, id), {
    method: "GET",
    auth: true,
  });
  return Array.isArray(json.data) ? json.data : [];
}

export async function createAdminTicketNote(
  kind: SupportTicketKind,
  id: number,
  body: string
): Promise<AdminTicketNote> {
  const json = await adminFetch<ApiSuccess<AdminTicketNote>>(notesUrl(kind, id), {
    method: "POST",
    auth: true,
    body: JSON.stringify({ body }),
  });
  return json.data;
}

export async function deleteAdminTicketNote(
  kind: SupportTicketKind,
  id: number,
  noteId: number
): Promise<void> {
  await adminFetch<ApiSuccess<{ id: number }>>(notesUrl(kind, id, noteId), {
    method: "DELETE",
    auth: true,
  });
}

export const adminTicketNotesQueryKeyRoot = ["admin", "ticket-notes"] as const;

export function adminTicketNotesQueryKey(kind: SupportTicketKind, id: number) {
  return [...adminTicketNotesQueryKeyRoot, kind, id] as const;
}
