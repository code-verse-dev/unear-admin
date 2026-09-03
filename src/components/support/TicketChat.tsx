import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Loader2, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useSendSupportTicketMessageMutation,
  useSupportTicketMessagesQuery,
} from "@/hooks/useSupportTicketChat";
import type { SupportChatRoom, SupportTicketKind } from "@/api/supportTicketChat";
import { TicketTimeline } from "@/components/support/TicketTimeline";
import { mergeTimeline, messagesToTimeline, type TimelineItem } from "@/lib/ticketTimeline";

export function TicketChat({
  kind,
  id,
  rooms,
  disabled,
  events = [],
  title,
  source = "Via app",
  tag,
  counterPromptKey = 0,
}: {
  kind: SupportTicketKind;
  id: number;
  rooms: { id: SupportChatRoom; label: string }[];
  disabled?: boolean;
  events?: TimelineItem[];
  title: string;
  source?: string;
  tag?: string;
  counterPromptKey?: number;
}) {
  const [room, setRoom] = useState<SupportChatRoom>(rooms[0]?.id ?? "user");
  const [thread, setThread] = useState<"all" | SupportChatRoom>(rooms.length > 1 ? "all" : rooms[0]?.id ?? "user");
  const [view, setView] = useState<"all" | "messages" | "events">("all");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast } = useToast();

  const userQ = useSupportTicketMessagesQuery(kind, id, "user", rooms.some((r) => r.id === "user"));
  const hostQ = useSupportTicketMessagesQuery(kind, id, "host", rooms.some((r) => r.id === "host"));
  const guestQ = useSupportTicketMessagesQuery(kind, id, "guest", rooms.some((r) => r.id === "guest"));
  const sendMutation = useSendSupportTicketMessageMutation();

  const isLoading = userQ.isLoading || hostQ.isLoading || guestQ.isLoading;
  const isFetching = userQ.isFetching || hostQ.isFetching || guestQ.isFetching;

  useEffect(() => {
    if (!rooms.some((r) => r.id === room) && rooms[0]) setRoom(rooms[0].id);
  }, [rooms, room]);

  const timeline = useMemo(() => {
    const msgs: TimelineItem[] = [
      ...messagesToTimeline(userQ.data?.messages ?? [], "user"),
      ...messagesToTimeline(hostQ.data?.messages ?? [], "host"),
      ...messagesToTimeline(guestQ.data?.messages ?? [], "guest"),
    ];
    let items = mergeTimeline([...events, ...msgs]);
    if (rooms.length > 1 && thread !== "all") {
      items = items.filter((i) => i.kind !== "message" || i.room === thread);
    }
    if (view === "messages") items = items.filter((i) => i.kind === "message");
    if (view === "events") items = items.filter((i) => i.kind !== "message");
    return items;
  }, [events, userQ.data, hostQ.data, guestQ.data, thread, rooms.length, view]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline.length, thread, view]);

  useEffect(() => {
    if (!counterPromptKey) return;
    setDraft((current) => current || "Counteroffer: ");
    requestAnimationFrame(() => composerRef.current?.focus());
  }, [counterPromptKey]);

  const refetchAll = () => {
    void userQ.refetch();
    void hostQ.refetch();
    void guestQ.refetch();
  };

  const onSend = async () => {
    const text = draft.trim();
    if (!text || disabled) return;
    try {
      await sendMutation.mutateAsync({ kind, id, room, message: text });
      setDraft("");
      setView("all");
    } catch (e) {
      toast({
        title: "Could not send message",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Communication</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate font-medium text-foreground">{title}</span>
            {tag ? <span className="rounded bg-muted px-1.5 py-px font-medium text-muted-foreground">{tag}</span> : null}
            <span>{source}</span>
          </div>
        </div>
        {rooms.length > 1
          ? rooms.map((r) => (
              <Button
                key={r.id}
                type="button"
                size="sm"
                variant={room === r.id ? "secondary" : "ghost"}
                onClick={() => {
                  setRoom(r.id);
                  setThread(r.id);
                }}
              >
                {r.label}
              </Button>
            ))
          : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setView("all")}>All activity</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView("messages")}>Messages only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView("events")}>Events only</DropdownMenuItem>
            {rooms.length > 1 ? (
              <>
                <DropdownMenuItem onClick={() => setThread("all")}>Both threads</DropdownMenuItem>
                {rooms.map((r) => (
                  <DropdownMenuItem
                    key={r.id}
                    onClick={() => {
                      setThread(r.id);
                      setRoom(r.id);
                    }}
                  >
                    {r.label} thread
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={refetchAll} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <TicketTimeline items={timeline} />
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        {disabled ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">Chat is closed for this ticket.</p>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              ref={composerRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                rooms.length > 1
                  ? `Reply to ${rooms.find((r) => r.id === room)?.label ?? "user"}…`
                  : "Write a reply…"
              }
              rows={2}
              disabled={sendMutation.isPending}
              className="min-h-[44px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <Button
              type="button"
              className="h-11 shrink-0"
              disabled={sendMutation.isPending || !draft.trim()}
              onClick={() => void onSend()}
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
