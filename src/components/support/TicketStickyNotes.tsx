import { useEffect, useState } from "react";
import { Loader2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

export function TicketStickyNotes({
  value,
  onSave,
  busy = false,
}: {
  value: string;
  onSave: (notes: string) => Promise<void>;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const hasNotes = Boolean(value.trim());
  const dirty = draft !== value;

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
          {hasNotes ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div>
          <p className="text-sm font-medium">Ticket notes</p>
          <p className="text-xs text-muted-foreground">Internal sticky notes. Only admins can see these.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-sticky-notes" className="sr-only">
            Notes
          </Label>
          <Textarea
            id="ticket-sticky-notes"
            rows={6}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            placeholder="Add a reminder about this ticket…"
            className="resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={busy || !dirty}
            onClick={() => {
              void onSave(draft)
                .then(() => setOpen(false))
                .catch(() => {});
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save notes"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
