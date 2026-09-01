import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/admin-api";
import { Progress } from "@/components/ui/progress";
import { TicketAttachments } from "@/components/support/TicketAttachments";
import { initials, type TimelineItem } from "@/lib/ticketTimeline";

const money = (n: number | null | undefined) =>
  n == null
    ? null
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

function relative(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true }).replace("about ", "");
  } catch {
    return iso;
  }
}

const AVATAR = [
  "bg-zinc-800 text-white",
  "bg-violet-600 text-white",
  "bg-amber-500 text-white",
  "bg-emerald-600 text-white",
  "bg-rose-500 text-white",
  "bg-teal-600 text-white",
  "bg-sky-600 text-white",
];

function avatarClass(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i += 1) n += name.charCodeAt(i);
  return AVATAR[n % AVATAR.length];
}

function statusClass(tone: TimelineItem["cardStatusTone"]) {
  if (tone === "warning") return "bg-orange-100 text-orange-700";
  if (tone === "destructive") return "bg-red-100 text-red-700";
  if (tone === "success") return "bg-emerald-100 text-emerald-700";
  if (tone === "info") return "bg-sky-100 text-sky-700";
  return "bg-muted text-muted-foreground";
}

function Avatar({ item }: { item: TimelineItem }) {
  const name = item.actor || item.title || "?";
  const img = resolveMediaUrl(item.actorImage);
  return (
    <div
      className={cn(
        "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold tracking-wide",
        avatarClass(name)
      )}
    >
      {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

export function TicketTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium">No communication yet</p>
        <p className="text-xs text-muted-foreground">Replies and ticket events will appear here.</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-[18px] border-l border-border/80 py-1">
      {items.map((item) => {
        const isMsg = item.kind === "message";
        const isCard = item.kind === "card";
        const name = isMsg || isCard ? item.actor || item.title : item.actor || "System";
        return (
          <li key={item.id} className="relative pb-7 pl-8 last:pb-2">
            <span className="absolute -left-[18px] top-0">
              <Avatar item={item} />
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="shrink-0 text-xs text-muted-foreground">{relative(item.at)}</p>
            </div>

            {isMsg ? (
              <div className="mt-1 max-w-xl">
                {item.body ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                ) : null}
                {item.attachments && !(Array.isArray(item.attachments) && item.attachments.length === 0) ? (
                  <div className={item.body ? "mt-2" : undefined}>
                    <TicketAttachments attachments={item.attachments} compact />
                  </div>
                ) : null}
              </div>
            ) : isCard ? (
              <div className="mt-2 max-w-md rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.cardLabel || item.title}</p>
                    {item.amount != null ? (
                      <p className="text-xs tabular-nums text-muted-foreground">{money(item.amount)}</p>
                    ) : null}
                  </div>
                  {item.cardStatus ? (
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        statusClass(item.cardStatusTone)
                      )}
                    >
                      {item.cardStatus}
                    </span>
                  ) : null}
                </div>
                {item.body ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.body}</p>
                ) : null}
                {item.progress != null ? (
                  <div className="mt-3">
                    <Progress
                      value={item.progress}
                      className="h-1.5 bg-violet-100 [&>div]:bg-violet-500"
                    />
                    <p className="mt-1 text-right text-[11px] font-medium text-violet-600">{item.progress}%</p>
                  </div>
                ) : null}
                {item.attachments && !(Array.isArray(item.attachments) && item.attachments.length === 0) ? (
                  <div className="mt-3">
                    <TicketAttachments attachments={item.attachments} compact />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium text-violet-600">{item.title}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
