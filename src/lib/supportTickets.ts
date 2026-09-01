import { DISPUTE_REQUEST_STATUS, disputeAttachmentUrls, type AdminDisputeRequest } from "@/api/disputeRequests";
import { DAMAGE_TICKET_STATUS, damageTicketAttachmentUrls, type AdminDamageTicket } from "@/api/damageTickets";
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

export function disputeStatusLabel(s: number): string {
  if (s === DISPUTE_REQUEST_STATUS.REQUESTED) return "Awaiting Support";
  if (s === DISPUTE_REQUEST_STATUS.COMPLETED) return "Accepted";
  if (s === DISPUTE_REQUEST_STATUS.CANCELLED) return "Rejected";
  return `Status ${s}`;
}

export function disputeStatusVariant(
  s: number
): SupportTicketRow["statusVariant"] {
  if (s === DISPUTE_REQUEST_STATUS.COMPLETED) return "success";
  if (s === DISPUTE_REQUEST_STATUS.CANCELLED) return "destructive";
  if (s === DISPUTE_REQUEST_STATUS.REQUESTED) return "warning";
  return "secondary";
}

export function damageStatusLabel(s: number): string {
  switch (s) {
    case DAMAGE_TICKET_STATUS.OPEN:
      return "Awaiting Support";
    case DAMAGE_TICKET_STATUS.IN_DISCUSSION:
      return "In discussion";
    case DAMAGE_TICKET_STATUS.AMOUNT_SET:
      return "Amount set";
    case DAMAGE_TICKET_STATUS.CHARGED:
      return "Accepted";
    case DAMAGE_TICKET_STATUS.CANCELLED:
      return "Rejected";
    default:
      return `Status ${s}`;
  }
}

export function damageStatusVariant(s: number): SupportTicketRow["statusVariant"] {
  if (s === DAMAGE_TICKET_STATUS.CHARGED) return "success";
  if (s === DAMAGE_TICKET_STATUS.CANCELLED) return "destructive";
  if (s === DAMAGE_TICKET_STATUS.AMOUNT_SET) return "info";
  if (s === DAMAGE_TICKET_STATUS.IN_DISCUSSION) return "warning";
  return "secondary";
}

export function kindLabel(kind: SupportTicketKind): string {
  if (kind === "dispute") return "Dispute";
  if (kind === "damage") return "Damage";
  return "Trip extras";
}

export function kindChipClass(kind: SupportTicketKind): string {
  if (kind === "dispute") return "bg-info/10 text-info border-info/20";
  if (kind === "damage") return "bg-warning/10 text-warning border-warning/20";
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

export function rowFromDispute(d: AdminDisputeRequest): SupportTicketRow {
  const files = disputeAttachmentUrls(d);
  const name = d.full_name || partyName(d.user, `User #${d.user_id}`);
  return {
    key: `dispute-${d.id}`,
    kind: "dispute",
    id: d.id,
    title: d.category || "Dispute",
    subtitle: name,
    statusLabel: disputeStatusLabel(d.status),
    statusVariant: disputeStatusVariant(d.status),
    isOpen: d.status === DISPUTE_REQUEST_STATUS.REQUESTED,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    requesterName: name,
    requesterImage: resolveMediaUrl(d.user?.image_url),
    amount: null,
    bookingId: null,
    attachmentCount: files.length,
    previewUrl: firstImage(files),
    email: d.email,
    phone: d.phone_number,
  };
}

export function rowFromDamage(t: AdminDamageTicket): SupportTicketRow {
  const files = damageTicketAttachmentUrls(t);
  const guest = partyName(t.guest, `Guest #${t.guest_id}`);
  return {
    key: `damage-${t.id}`,
    kind: "damage",
    id: t.id,
    title: t.damage_description?.trim() || `Booking #${t.booking_id}`,
    subtitle: `Host ${partyName(t.host, `#${t.host_id}`)} · Guest ${guest}`,
    statusLabel: damageStatusLabel(t.status),
    statusVariant: damageStatusVariant(t.status),
    isOpen:
      t.status === DAMAGE_TICKET_STATUS.OPEN ||
      t.status === DAMAGE_TICKET_STATUS.IN_DISCUSSION ||
      t.status === DAMAGE_TICKET_STATUS.AMOUNT_SET,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    requesterName: guest,
    requesterImage: resolveMediaUrl(t.guest?.image_url),
    amount: t.final_amount ?? t.proposed_amount ?? null,
    bookingId: t.booking_id,
    attachmentCount: files.length,
    previewUrl: firstImage(files),
    email: t.guest?.email,
    phone: t.guest?.mobile_no || undefined,
  };
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
