import type { AdminDisputeRequest } from "@/api/disputeRequests";
import { DISPUTE_REQUEST_STATUS } from "@/api/disputeRequests";
import type { AdminDamageTicket } from "@/api/damageTickets";
import { DAMAGE_TICKET_STATUS } from "@/api/damageTickets";
import type { AdminBookingInvoice } from "@/api/bookingInvoices";
import { BOOKING_INVOICE_STATUS, extrasStatusLabel, invoiceItemAttachmentUrls } from "@/api/bookingInvoices";
import type { SupportChatRoom, SupportTicketKind, SupportTicketMessage } from "@/api/supportTicketChat";
import { damageStatusLabel, disputeStatusLabel, kindLabel } from "@/lib/supportTickets";

export type TimelineKind = "event" | "message" | "card";

export type TimelineItem = {
  id: string;
  at: string;
  kind: TimelineKind;
  title: string;
  body?: string;
  actor?: string;
  actorImage?: string;
  actorRole?: "admin" | "host" | "guest" | "user" | "system";
  room?: SupportChatRoom;
  badge?: string;
  amount?: number | null;
  attachments?: unknown;
  cardLabel?: string;
  cardStatus?: string;
  cardStatusTone?: "warning" | "destructive" | "success" | "info" | "secondary";
  progress?: number;
};

export function initials(name: string | undefined | null) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

const money = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

function later(iso: string, ms: number) {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}

export function buildSupportTicketEvents(opts: {
  kind: SupportTicketKind;
  dispute?: AdminDisputeRequest | null;
  damage?: AdminDamageTicket | null;
  extras?: AdminBookingInvoice | null;
}): TimelineItem[] {
  const { kind, dispute, damage, extras } = opts;
  const items: TimelineItem[] = [];

  if (kind === "dispute" && dispute) {
    items.push({
      id: "opened",
      at: dispute.createdAt,
      kind: "card",
      title: `${kindLabel(kind)} opened`,
      body: [dispute.category, dispute.description].filter(Boolean).join("\n\n"),
      actor: dispute.full_name || "Requester",
      actorRole: "user",
      badge: "Opened",
      attachments: dispute.attachments,
      cardLabel: "Dispute",
      cardStatus: "Opened",
      cardStatusTone: "info",
      progress: 35,
    });
    if (dispute.status === DISPUTE_REQUEST_STATUS.COMPLETED) {
      items.push({
        id: "resolved",
        at: dispute.updatedAt || dispute.createdAt,
        kind: "event",
        title: "Ticket marked as resolved",
        actorRole: "admin",
        badge: disputeStatusLabel(dispute.status),
      });
    } else if (dispute.status === DISPUTE_REQUEST_STATUS.CANCELLED) {
      items.push({
        id: "rejected",
        at: dispute.updatedAt || dispute.createdAt,
        kind: "event",
        title: "Ticket rejected",
        actorRole: "admin",
        badge: disputeStatusLabel(dispute.status),
      });
    }
  }

  if (kind === "damage" && damage) {
    items.push({
      id: "opened",
      at: damage.createdAt,
      kind: "card",
      title: "Damage ticket opened",
      body: damage.damage_description || undefined,
      actor: "Host",
      actorRole: "host",
      badge: "Opened",
      amount: damage.proposed_amount,
      attachments: damage.attachments,
      cardLabel: "Damage claim",
      cardStatus: "Open",
      cardStatusTone: "warning",
      progress: 40,
    });
    if (damage.final_amount != null && damage.status >= DAMAGE_TICKET_STATUS.AMOUNT_SET) {
      items.push({
        id: "amount-set",
        at: later(damage.updatedAt || damage.createdAt, -60_000),
        kind: "event",
        title: `Amount set at ${money(damage.final_amount)}`,
        actorRole: "admin",
        badge: "Amount set",
        amount: damage.final_amount,
      });
    }
    if (damage.charged_at) {
      items.push({
        id: "charged",
        at: damage.charged_at,
        kind: "event",
        title: `Guest charged ${money(damage.final_amount ?? damage.proposed_amount)}`,
        actorRole: "admin",
        badge: damageStatusLabel(DAMAGE_TICKET_STATUS.CHARGED),
        amount: damage.final_amount ?? damage.proposed_amount,
      });
    } else if (damage.status === DAMAGE_TICKET_STATUS.CANCELLED) {
      items.push({
        id: "cancelled",
        at: damage.updatedAt || damage.createdAt,
        kind: "event",
        title: "Ticket rejected",
        body: damage.admin_notes || undefined,
        actorRole: "admin",
        badge: damageStatusLabel(DAMAGE_TICKET_STATUS.CANCELLED),
      });
    }
  }

  if (kind === "extras" && extras) {
    items.push({
      id: "created",
      at: extras.createdAt,
      kind: "card",
      title: "Trip extras invoice created",
      body: extras.note || extras.items?.map((i) => `${i.title} · ${money(i.amount)}`).join("\n"),
      actor: "Host",
      actorRole: "host",
      badge: "Invoice",
      amount: extras.total_amount,
      attachments: (extras.items || []).flatMap((item) => invoiceItemAttachmentUrls(item)),
      cardLabel: "Invoice",
      cardStatus:
        extras.status === BOOKING_INVOICE_STATUS.DISPUTED
          ? "Disputed"
          : extras.status === BOOKING_INVOICE_STATUS.PAID
            ? "Paid"
            : extras.sent_at
              ? "Sent"
              : "Open",
      cardStatusTone:
        extras.status === BOOKING_INVOICE_STATUS.DISPUTED
          ? "destructive"
          : extras.status === BOOKING_INVOICE_STATUS.PAID
            ? "success"
            : extras.sent_at
              ? "warning"
              : "info",
      progress:
        extras.status === BOOKING_INVOICE_STATUS.PAID || extras.status === BOOKING_INVOICE_STATUS.WAIVED
          ? 100
          : extras.status === BOOKING_INVOICE_STATUS.DISPUTED
            ? 64
            : extras.sent_at
              ? 64
              : 35,
    });
    if (extras.sent_at) {
      items.push({
        id: "sent",
        at: extras.sent_at,
        kind: "event",
        title: "Invoice sent to guest",
        actorRole: "host",
        badge: "Sent",
      });
    }
    if (extras.dispute_note || extras.status === BOOKING_INVOICE_STATUS.DISPUTED) {
      items.push({
        id: "disputed",
        at: extras.updatedAt || extras.createdAt,
        kind: "event",
        title: "Guest requested support",
        body: extras.dispute_note || undefined,
        actorRole: "guest",
        badge: extrasStatusLabel(BOOKING_INVOICE_STATUS.DISPUTED),
      });
    }
    if (extras.paid_at) {
      items.push({
        id: "paid",
        at: extras.paid_at,
        kind: "event",
        title: `Invoice paid ${money(extras.total_amount)}`,
        actorRole: "guest",
        badge: extrasStatusLabel(BOOKING_INVOICE_STATUS.PAID),
        amount: extras.total_amount,
      });
    } else if (extras.status === BOOKING_INVOICE_STATUS.WAIVED) {
      items.push({
        id: "waived",
        at: extras.updatedAt || extras.createdAt,
        kind: "event",
        title: "Extras waived",
        actorRole: "admin",
        badge: extrasStatusLabel(BOOKING_INVOICE_STATUS.WAIVED),
      });
    }
  }

  return items;
}

export function messagesToTimeline(
  messages: SupportTicketMessage[],
  room: SupportChatRoom
): TimelineItem[] {
  return messages.map((m) => {
    const admin = String(m.user_type || "").toUpperCase() === "ADMIN";
    const img = Array.isArray(m.user_image) ? m.user_image[0] : m.user_image;
    const fileUrl = Array.isArray(m.file_url) ? m.file_url[0] : m.file_url;
    return {
      id: `msg-${room}-${m.message_id}`,
      at: m.message_timestamp,
      kind: "message" as const,
      title: m.user_name || `User #${m.user_id}`,
      body: m.message,
      actor: m.user_name || `User #${m.user_id}`,
      actorImage: typeof img === "string" ? img : undefined,
      actorRole: admin ? "admin" : room === "host" ? "host" : room === "guest" ? "guest" : "user",
      room,
      attachments: fileUrl
        ? [{ url: fileUrl, name: m.file_name || undefined }]
        : undefined,
    };
  });
}

export function mergeTimeline(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
