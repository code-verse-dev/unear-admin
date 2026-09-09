import type { AdminDisputeRequest } from "@/api/disputeRequests";
import { DISPUTE_REQUEST_STATUS } from "@/api/disputeRequests";
import type { AdminDamageTicket } from "@/api/damageTickets";
import { DAMAGE_TICKET_STATUS } from "@/api/damageTickets";
import type { AdminBookingInvoice } from "@/api/bookingInvoices";
import { BOOKING_INVOICE_STATUS, extrasStatusLabel, invoiceItemAttachmentUrls } from "@/api/bookingInvoices";
import type { SupportChatRoom, SupportTicketKind, SupportTicketMessage } from "@/api/supportTicketChat";
import { damageStatusLabel, disputeStatusLabel, kindLabel, partyName } from "@/lib/supportTickets";
import type { AdminUnifiedTicket, UnifiedTicketTimelineItem } from "@/api/unifiedTickets";

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
  cardKind?: "booking" | "car" | "pre-inspection" | "post-inspection" | "claim";
  fields?: { label: string; value: string }[];
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

const PICKUP = 10;
const DROP_OFF = 20;

function hasItem(items: TimelineItem[], id: string) {
  return items.some((i) => i.id === id);
}

function inspectionFiles(
  inspections: { type?: number; attachments?: unknown }[] | undefined,
  type: number
): unknown[] {
  const files: unknown[] = [];
  for (const row of inspections || []) {
    if (Number(row.type) !== type) continue;
    files.push(...normalizeFiles(row.attachments));
  }
  return files;
}

function normalizeFiles(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [t];
    }
  }
  return [raw];
}

function bookingBody(opts: {
  host?: string;
  guest?: string;
  pickup?: string;
  returnAt?: string;
  amount?: number | null;
}) {
  const lines = [
    [opts.host && `Host ${opts.host}`, opts.guest && `Guest ${opts.guest}`].filter(Boolean).join(" · "),
    [opts.pickup, opts.returnAt].filter(Boolean).join(" → "),
    opts.amount != null ? `Trip ${money(opts.amount)}` : "",
  ].filter(Boolean);
  return lines.join("\n") || undefined;
}

export function buildSupportTicketEvents(opts: {
  kind: SupportTicketKind;
  dispute?: AdminDisputeRequest | null;
  damage?: AdminDamageTicket | null;
  extras?: AdminBookingInvoice | null;
  unified?: AdminUnifiedTicket | null;
}): TimelineItem[] {
  const { kind, dispute, damage, extras, unified } = opts;
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
    const vehicle = damage.booking?.vehicle;
    const hostName = partyName(damage.host, `#${damage.host_id}`);
    const guestName = partyName(damage.guest, `#${damage.guest_id}`);
    const carTitle = vehicle
      ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Car"
      : "Car";
    const inspections = damage.booking?.booking_inspections || [];
    const preFiles = inspectionFiles(inspections, PICKUP);
    const postFromBooking = inspectionFiles(inspections, DROP_OFF);
    const postFromLinked = normalizeFiles(damage.inspection?.attachments);
    const postFiles = postFromBooking.length ? postFromBooking : postFromLinked;
    const preNote = inspections
      .filter((row) => Number(row.type) === PICKUP)
      .map((row) => row.description || row.damage)
      .filter(Boolean)
      .join("\n");
    const postNote =
      inspections
        .filter((row) => Number(row.type) === DROP_OFF)
        .map((row) => row.description || row.damage)
        .filter(Boolean)
        .join("\n") || damage.inspection?.description || damage.inspection?.damage || "";

    if (damage.booking) {
      items.push({
        id: "booking",
        at: damage.createdAt,
        kind: "card",
        title: `Booking #${damage.booking_id}`,
        body: bookingBody({
          host: hostName,
          guest: guestName,
          pickup: damage.booking.pickup_at,
          returnAt: damage.booking.return_at,
          amount: damage.booking.total_amount ?? null,
        }),
        actorRole: "system",
        actor: "Booking",
        cardKind: "booking",
        cardLabel: "Booking",
        cardStatus: "Trip",
        cardStatusTone: "info",
        amount: damage.booking.total_amount ?? null,
        fields: [
          { label: "Host", value: hostName },
          { label: "Guest", value: guestName },
          { label: "Pickup", value: damage.booking.pickup_at || "—" },
          { label: "Return", value: damage.booking.return_at || "—" },
        ],
      });
    }

    items.push({
      id: "vehicle",
      at: damage.createdAt,
      kind: "card",
      title: carTitle,
      actorRole: "system",
      actor: "Car",
      cardKind: "car",
      cardLabel: "Car",
      cardStatus: vehicle ? "Listed" : "Missing",
      cardStatusTone: vehicle ? "secondary" : "warning",
      fields: [
        { label: "Vehicle", value: carTitle },
        { label: "Plate", value: vehicle?.license_plate_number || "—" },
        { label: "Booking", value: `#${damage.booking_id}` },
      ],
    });

    items.push({
      id: "pre-photos",
      at: damage.createdAt,
      kind: "card",
      title: "Pre-inspection",
      body: preNote || undefined,
      actorRole: "system",
      actor: "Pre-inspection",
      cardKind: "pre-inspection",
      cardLabel: "Pre-inspection",
      cardStatus: preFiles.length ? `${preFiles.length} photo${preFiles.length === 1 ? "" : "s"}` : "No photos",
      cardStatusTone: preFiles.length ? "info" : "secondary",
      attachments: preFiles,
    });

    items.push({
      id: "post-photos",
      at: damage.createdAt,
      kind: "card",
      title: "Post-inspection",
      body: postNote || undefined,
      actorRole: "host",
      actor: "Post-inspection",
      cardKind: "post-inspection",
      cardLabel: "Post-inspection",
      cardStatus: postFiles.length ? `${postFiles.length} photo${postFiles.length === 1 ? "" : "s"}` : "No photos",
      cardStatusTone: postFiles.length ? "warning" : "secondary",
      attachments: postFiles,
    });

    items.push({
      id: "opened",
      at: damage.createdAt,
      kind: "card",
      title: "Damage claim",
      body: damage.damage_description || undefined,
      actor: hostName,
      actorRole: "host",
      badge: "Opened",
      amount: damage.proposed_amount,
      attachments: damage.attachments,
      cardKind: "claim",
      cardLabel: "Damage claim",
      cardStatus: damageStatusLabel(damage.status),
      cardStatusTone: damage.status === DAMAGE_TICKET_STATUS.CANCELLED ? "destructive" : damage.status === DAMAGE_TICKET_STATUS.CHARGED ? "success" : "warning",
      fields: [
        { label: "Host", value: hostName },
        { label: "Guest", value: guestName },
        { label: "Proposed", value: money(damage.proposed_amount) },
        {
          label: "Charge",
          value: damage.final_amount != null ? money(damage.final_amount) : "Not set",
        },
      ],
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
      id: "booking",
      at: extras.createdAt,
      kind: "card",
      title: `Booking #${extras.booking_id}`,
      body: [`Host #${extras.host_id}`, `Guest #${extras.guest_id}`].join(" · "),
      actorRole: "system",
      cardLabel: "Booking",
      cardStatus: "Details",
      cardStatusTone: "info",
    });
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

  if ((kind === "claim" || kind === "general") && unified) {
    const mapped = (unified.timeline || []).map(unifiedTimelineItem);
    items.push(...mapped);
    items.push(...unifiedContextCards(unified, mapped));
  }

  return items;
}

function unifiedContextCards(t: AdminUnifiedTicket, existing: TimelineItem[]): TimelineItem[] {
  const cards: TimelineItem[] = [];
  const at = t.createdAt;
  const booking = t.booking;
  const vehicle = t.vehicle || booking?.booking_vehicle || null;
  const hostName = partyName(t.host, t.host_id ? `#${t.host_id}` : "");
  const guestName = partyName(t.guest, t.guest_id ? `#${t.guest_id}` : "");

  if (booking && !hasItem(existing, "booking")) {
    cards.push({
      id: "booking",
      at: booking.pickup_at || at,
      kind: "card",
      title: `Booking #${booking.id}`,
      body: bookingBody({
        host: hostName || undefined,
        guest: guestName || undefined,
        pickup: booking.pickup_at,
        returnAt: booking.return_at,
        amount: booking.total_amount ?? null,
      }),
      actorRole: "system",
      cardLabel: "Booking",
      cardStatus: "Details",
      cardStatusTone: "info",
      amount: booking.total_amount ?? null,
    });
  }
  if (vehicle && !hasItem(existing, "vehicle")) {
    cards.push({
      id: "vehicle",
      at,
      kind: "card",
      title: [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || `Vehicle #${vehicle.id}`,
      body: vehicle.license_plate_number ? `Plate ${vehicle.license_plate_number}` : undefined,
      actorRole: "system",
      actor: "Car",
      cardKind: "car",
      cardLabel: "Car",
      cardStatus: "Listed",
      cardStatusTone: "secondary",
      fields: [
        { label: "Vehicle", value: [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || `Vehicle #${vehicle.id}` },
        { label: "Plate", value: vehicle.license_plate_number || "—" },
      ],
    });
  }
  const pre = inspectionFiles(booking?.booking_inspections, PICKUP);
  const post = inspectionFiles(booking?.booking_inspections, DROP_OFF);
  if (!hasItem(existing, "pre-photos")) {
    cards.push({
      id: "pre-photos",
      at,
      kind: "card",
      title: "Pre-inspection",
      actorRole: "system",
      actor: "Pre-inspection",
      cardKind: "pre-inspection",
      cardLabel: "Pre-inspection",
      cardStatus: pre.length ? `${pre.length} photo${pre.length === 1 ? "" : "s"}` : "No photos",
      cardStatusTone: pre.length ? "info" : "secondary",
      attachments: pre,
    });
  }
  if (!hasItem(existing, "post-photos")) {
    cards.push({
      id: "post-photos",
      at,
      kind: "card",
      title: "Post-inspection",
      actorRole: "system",
      actor: "Post-inspection",
      cardKind: "post-inspection",
      cardLabel: "Post-inspection",
      cardStatus: post.length ? `${post.length} photo${post.length === 1 ? "" : "s"}` : "No photos",
      cardStatusTone: post.length ? "warning" : "secondary",
      attachments: post,
    });
  }
  if (t.claim && !hasItem(existing, "claim")) {
    cards.push({
      id: "claim",
      at,
      kind: "card",
      title: `Claim #${t.claim.id}`,
      body: [
        t.claim.claim_type_label || t.claim.claim_type,
        t.claim.direction === "host_to_guest" ? `${hostName} → ${guestName}` : `${guestName} → ${hostName}`,
        t.claim.description,
      ]
        .filter(Boolean)
        .join("\n"),
      amount: t.claim.amount,
      actorRole: t.claim.direction === "host_to_guest" ? "host" : "guest",
      cardLabel: t.claim.claim_type_label || "Claim",
      cardStatus: "Disputed",
      attachments: t.claim.attachments,
    });
  }
  return cards;
}

function unifiedTimelineItem(row: UnifiedTicketTimelineItem): TimelineItem {
  return {
    id: row.id,
    at: row.at,
    kind: row.kind === "card" ? "card" : row.kind === "message" ? "message" : "event",
    title: row.title,
    body: row.body,
    actor: row.actor,
    actorRole: (row.actorRole as TimelineItem["actorRole"]) || "system",
    badge: row.badge,
    amount: row.amount,
    attachments: row.attachments,
    cardLabel: row.cardLabel,
    cardStatus: row.cardStatus,
    cardStatusTone: row.cardStatusTone as TimelineItem["cardStatusTone"],
  };
}

export function messagesToTimeline(
  messages: SupportTicketMessage[],
  room: SupportChatRoom
): TimelineItem[] {
  return messages.map((m) => {
    const admin = String(m.user_type || "").toUpperCase() === "ADMIN";
    const fileUrl = Array.isArray(m.file_url) ? m.file_url[0] : m.file_url;
    return {
      id: `msg-${room}-${m.message_id}`,
      at: m.message_timestamp,
      kind: "message" as const,
      title: m.user_name || `User #${m.user_id}`,
      body: m.message,
      actor: m.user_name || `User #${m.user_id}`,
      actorRole: admin ? "admin" : room === "host" ? "host" : room === "guest" ? "guest" : "user",
      room,
      attachments: fileUrl
        ? [{ url: fileUrl, name: m.file_name || undefined }]
        : undefined,
    };
  });
}

export function mergeTimeline(items: TimelineItem[]): TimelineItem[] {
  const rank = (item: TimelineItem) => {
    if (item.id === "booking") return 0;
    if (item.id === "vehicle") return 1;
    if (item.id === "pre-photos") return 2;
    if (item.id === "post-photos" || item.id === "photos") return 3;
    if (item.id === "claim") return 4;
    if (item.id === "opened" || item.id === "created") return 5;
    if (item.kind === "card") return 6;
    if (item.kind === "event") return 7;
    return 8;
  };
  return [...items].sort((a, b) => {
    const dt = new Date(a.at).getTime() - new Date(b.at).getTime();
    if (dt !== 0) return dt;
    return rank(a) - rank(b);
  });
}
