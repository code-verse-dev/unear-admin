import { formatDistanceToNow } from "date-fns";
import { Camera, CarFront, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
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

function cardKind(item: TimelineItem): TimelineItem["cardKind"] {
  if (item.cardKind) return item.cardKind;
  if (item.id === "vehicle") return "car";
  if (item.id === "pre-photos") return "pre-inspection";
  if (item.id === "post-photos") return "post-inspection";
  if (item.id === "opened" || item.id === "claim") return "claim";
  if (item.id === "booking") return "booking";
  const label = (item.cardLabel || item.title || "").toLowerCase();
  if (label.includes("pre-inspect") || label.includes("pre-trip")) return "pre-inspection";
  if (label.includes("post-inspect") || label.includes("post-trip")) return "post-inspection";
  if (label === "car" || label === "vehicle") return "car";
  if (label.includes("damage") || label.includes("claim")) return "claim";
  return undefined;
}

function CardIcon({ kind }: { kind: TimelineItem["cardKind"] }) {
  if (kind === "car") return <CarFront className="h-4 w-4" />;
  if (kind === "pre-inspection" || kind === "post-inspection") return <Camera className="h-4 w-4" />;
  if (kind === "claim") return <FileWarning className="h-4 w-4" />;
  return null;
}

function hasAttachments(attachments: unknown) {
  if (!attachments) return false;
  if (Array.isArray(attachments)) return attachments.length > 0;
  return true;
}

function Avatar({ item }: { item: TimelineItem }) {
  const name = item.actor || item.title || "?";
  return (
    <div
      className={cn(
        "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold tracking-wide",
        avatarClass(name)
      )}
    >
      {initials(name)}
    </div>
  );
}

export function TicketTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium">No timeline yet</p>
        <p className="text-xs text-muted-foreground">Car, inspections, messages, and actions will appear here.</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-[18px] border-l border-border/80 py-1">
      {items.map((item) => {
        const isMsg = item.kind === "message";
        const isCard = item.kind === "card";
        const kind = cardKind(item);
        const isInspection = kind === "pre-inspection" || kind === "post-inspection";
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
              <div className="mt-1 max-w-2xl">
                {item.body ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                ) : null}
                {hasAttachments(item.attachments) ? (
                  <div className={item.body ? "mt-2" : undefined}>
                    <TicketAttachments attachments={item.attachments} compact />
                  </div>
                ) : null}
              </div>
            ) : isCard ? (
              <div
                className={cn(
                  "mt-2 max-w-2xl rounded-xl border bg-card p-4 shadow-sm",
                  kind === "claim" && "border-amber-200/80",
                  kind === "pre-inspection" && "border-sky-200/80",
                  kind === "post-inspection" && "border-orange-200/80",
                  kind === "car" && "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CardIcon kind={kind} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.cardLabel || item.title}</p>
                      {item.title && item.cardLabel && item.title !== item.cardLabel ? (
                        <p className="text-xs text-muted-foreground">{item.title}</p>
                      ) : null}
                    </div>
                  </div>
                  {item.cardStatus ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        statusClass(item.cardStatusTone)
                      )}
                    >
                      {item.cardStatus}
                    </span>
                  ) : null}
                </div>

                {item.amount != null ? (
                  <p className="mt-3 text-lg font-semibold tabular-nums tracking-tight">{money(item.amount)}</p>
                ) : null}

                {item.fields?.length ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    {item.fields.map((field) => (
                      <div key={field.label}>
                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{field.label}</dt>
                        <dd className="text-sm">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {item.body ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
                ) : null}

                {isInspection && !hasAttachments(item.attachments) ? (
                  <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                    No {kind === "pre-inspection" ? "pre-inspection" : "post-inspection"} photos
                  </div>
                ) : hasAttachments(item.attachments) ? (
                  <div className="mt-3">
                    <TicketAttachments attachments={item.attachments} compact size={isInspection ? "lg" : "sm"} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-1 max-w-2xl">
                <p className="text-sm font-medium text-violet-600">{item.title}</p>
                {item.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
