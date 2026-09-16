import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupportTicketKind } from "@/api/supportTicketChat";
import {
  adminTicketNotesQueryKey,
  adminTicketNotesQueryKeyRoot,
  createAdminTicketNote,
  deleteAdminTicketNote,
  listAdminTicketNotes,
} from "@/api/adminTicketNotes";

export function useAdminTicketNotesQuery(kind: SupportTicketKind, id: number, enabled = true) {
  return useQuery({
    queryKey: adminTicketNotesQueryKey(kind, id),
    queryFn: () => listAdminTicketNotes(kind, id),
    enabled: enabled && id > 0,
  });
}

export function useCreateAdminTicketNoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, body }: { kind: SupportTicketKind; id: number; body: string }) =>
      createAdminTicketNote(kind, id, body),
    onSuccess: (_data, { kind, id }) => {
      void qc.invalidateQueries({ queryKey: adminTicketNotesQueryKey(kind, id) });
      void qc.invalidateQueries({ queryKey: adminTicketNotesQueryKeyRoot });
    },
  });
}

export function useDeleteAdminTicketNoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, noteId }: { kind: SupportTicketKind; id: number; noteId: number }) =>
      deleteAdminTicketNote(kind, id, noteId),
    onSuccess: (_data, { kind, id }) => {
      void qc.invalidateQueries({ queryKey: adminTicketNotesQueryKey(kind, id) });
    },
  });
}
