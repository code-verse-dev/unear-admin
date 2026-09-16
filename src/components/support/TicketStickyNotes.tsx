import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { SupportTicketKind } from "@/api/supportTicketChat";
import {
  useAdminTicketNotesQuery,
  useCreateAdminTicketNoteMutation,
  useDeleteAdminTicketNoteMutation,
} from "@/hooks/useAdminTicketNotes";

function noteTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true }).replace("about ", "");
  } catch {
    return "";
  }
}

export function TicketStickyNotes({ kind, id }: { kind: SupportTicketKind; id: number }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { toast } = useToast();
  const notesQ = useAdminTicketNotesQuery(kind, id);
  const createMut = useCreateAdminTicketNoteMutation();
  const deleteMut = useDeleteAdminTicketNoteMutation();

  const notes = notesQ.data ?? [];
  const busy = createMut.isPending || deleteMut.isPending;

  const addNote = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    try {
      await createMut.mutateAsync({ kind, id, body });
      setDraft("");
      toast({ title: "Note added" });
    } catch (e) {
      toast({
        title: "Could not add note",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const removeNote = async (noteId: number) => {
    try {
      await deleteMut.mutateAsync({ kind, id, noteId });
      toast({ title: "Note deleted" });
    } catch (e) {
      toast({
        title: "Could not delete note",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="relative h-8 w-8"
          aria-label="Ticket notes"
          title="Ticket notes"
        >
          <StickyNote className="h-4 w-4" />
          {notes.length > 0 ? (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold leading-none text-white">
              {notes.length > 9 ? "9+" : notes.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-3 p-4">
        <div>
          <p className="text-sm font-medium">Ticket notes</p>
          <p className="text-xs text-muted-foreground">Internal sticky notes. Only admins can see these.</p>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
          {notesQ.isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-muted-foreground">
                    {note.creator_name}
                    {note.created_at ? ` · ${noteTime(note.created_at)}` : ""}
                  </p>
                  {note.can_delete ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={busy}
                      aria-label="Delete note"
                      title="Delete note"
                      onClick={() => void removeNote(note.id)}
                    >
                      {deleteMut.isPending && deleteMut.variables?.noteId === note.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Label htmlFor="ticket-sticky-note-new" className="sr-only">
            New note
          </Label>
          <Textarea
            id="ticket-sticky-note-new"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            placeholder="Add a new note…"
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void addNote();
              }
            }}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={busy || !draft.trim()} onClick={() => void addNote()}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add note"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
