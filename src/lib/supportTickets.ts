import {
  BOOKING_INVOICE_STATUS,
  extrasIsOpen,
  extrasStatusLabel,
  extrasStatusVariant,
  invoiceItemAttachmentUrls,
  type AdminBookingInvoice,
} from "@/api/bookingInvoices";
import { resolveMediaUrl } from "@/lib/admin-api";
import type { SupportTicketKind } from "@/api/supportTicketChat";
import type { AdminUnifiedTicket } from "@/api/unifiedTickets";
import { UNIFIED_TICKET_STATUS } from "@/api/unifiedTickets";

export type SupportTicketRow = {
  key: string;
  kind: SupportTicketKind;
  id: number;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusVariant: "success" | "warning" | "destructive" | "default" | "secondary" | "info";
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  requesterName: string;
  requesterImage?: string;
  amount: number | null;
  bookingId: number | null;
  attachmentCount: number;
  previewUrl?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
};

export function ticketRef(id: number | string | null | undefined) {
  if (id == null || id === "") return "TKT-—";
  return `TKT-${id}`;
}

export function kindLabel(kind: SupportTicketKind): string {
  if (kind === "claim") return "Claim";
  if (kind === "general") return "General";
  return "Trip extras";
}

export function isClaimKind(kind: SupportTicketKind): boolean {
  return kind === "claim";
}

export function kindChipClass(kind: SupportTicketKind): string {
  if (kind === "claim") return "bg-info/10 text-info border-info/20";
  if (kind === "general") return "bg-primary/10 text-primary border-primary/20";
  return "bg-secondary/10 text-secondary border-secondary/20";
}

export function partyName(
  u: { firstname?: string; lastname?: string; email?: string; id?: number } | null | undefined,
  fallback: string
) {
  if (!u) return fallback;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.email || fallback;
}

function firstImage(urls: string[]): string | undefined {
  return urls.find((u) => /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i.test(u));
}

export function rowFromExtras(inv: AdminBookingInvoice): SupportTicketRow {
  const files = (inv.items || []).flatMap((item) => invoiceItemAttachmentUrls(item));
  const first = inv.items?.[0]?.title;
  return {
    key: `extras-${inv.id}`,
    kind: "extras",
    id: inv.id,
    title: first || `Booking #${inv.booking_id}`,
    subtitle: `Host #${inv.host_id} · Guest #${inv.guest_id}`,
    statusLabel: extrasStatusLabel(inv.status),
    statusVariant: extrasStatusVariant(inv.status),
    isOpen: extrasIsOpen(inv.status),
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    requesterName: `Guest #${inv.guest_id}`,
    amount: inv.total_amount ?? null,
    bookingId: inv.booking_id,
    attachmentCount: files.length,
    previewUrl: firstImage(files),
  };
}

export function rowFromUnified(t: AdminUnifiedTicket): SupportTicketRow {
  const name = partyName(t.requester, `User #${t.requester_id}`);
  const files = Array.isArray(t.attachments) ? (t.attachments as string[]) : [];
  return {
    key: `${t.kind}-${t.id}`,
    kind: t.kind,
    id: t.id,
    title: t.title || t.category || kindLabel(t.kind),
    subtitle: t.booking_id ? `Booking #${t.booking_id}` : name,
    statusLabel: t.status_label || (t.is_open ? "Awaiting Support" : "Closed"),
    statusVariant: t.status === UNIFIED_TICKET_STATUS.CANCELLED ? "destructive" : t.is_open ? "warning" : "success",
    isOpen: !!t.is_open || t.status === UNIFIED_TICKET_STATUS.OPEN || t.status === UNIFIED_TICKET_STATUS.IN_DISCUSSION,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    requesterName: name,
    requesterImage: resolveMediaUrl(t.requester?.image_url),
    amount: t.amount ?? t.claim?.amount ?? null,
    bookingId: t.booking_id ?? null,
    attachmentCount: files.length,
    email: t.requester?.email,
    phone: t.requester?.mobile_no || undefined,
  };
}

export function ticketMatchesSearch(row: SupportTicketRow, q: string): boolean {
  const hay = [
    row.title,
    row.subtitle,
    row.requesterName,
    row.statusLabel,
    row.email,
    row.phone,
    row.bookingId != null ? `booking ${row.bookingId}` : "",
    `ticket #${row.id}`,
    row.kind,
    kindLabel(row.kind),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function exportTicketsCsv(rows: SupportTicketRow[]) {
  const header = ["Ticket", "Type", "Subject", "Requester", "Status", "Amount", "Booking", "Opened", "Updated"];
  const lines = rows.map((r) =>
    [
      `#${r.id}`,
      kindLabel(r.kind),
      r.title,
      r.requesterName,
      r.statusLabel,
      r.amount != null ? String(r.amount) : "",
      r.bookingId != null ? String(r.bookingId) : "",
      r.createdAt,
      r.updatedAt,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `support-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const SUPPORT_PAGE_SIZE = 10;
export { BOOKING_INVOICE_STATUS };
