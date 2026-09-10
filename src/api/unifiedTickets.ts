import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

export const UNIFIED_TICKET_STATUS = {
  OPEN: 10,
  IN_DISCUSSION: 20,
  RESOLVED: 30,
  CANCELLED: 40,
} as const;

export type UnifiedTicketKind = "claim" | "general";

export type UnifiedTicketUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  mobile_no?: string | null;
  image_url?: string | null;
};

export type UnifiedTicketTimelineItem = {
  id: string;
  at: string;
  kind: "event" | "message" | "card";
  title: string;
  body?: string;
  actor?: string;
  actorImage?: string;
  actorRole?: string;
  badge?: string;
  amount?: number | null;
  attachments?: unknown;
  cardLabel?: string;
  cardStatus?: string;
  cardStatusTone?: string;
  cardKind?: string;
  fields?: { label: string; value: string }[];
  offer_status?: string;
  offer_event_id?: number;
  can_approve_offer?: boolean;
  can_reject_offer?: boolean;
  current_amount?: number | null;
};

export type UnifiedTicketPendingCounter = {
  event_id: number;
  amount: number | null;
  previous_amount?: number | null;
  status?: string;
  actor_role?: string;
  actor_user_id?: number | null;
  note?: string | null;
  created_at?: string;
};

export type AdminUnifiedTicket = {
  id: number;
  kind: UnifiedTicketKind;
  claim_id?: number | null;
  booking_id?: number | null;
  vehicle_id?: number | null;
  requester_id: number;
  host_id?: number | null;
  guest_id?: number | null;
  title?: string | null;
  category?: string | null;
  description?: string | null;
  attachments?: unknown;
  amount?: number | null;
  status: number;
  status_label?: string;
  is_open?: boolean;
  admin_notes?: string | null;
  requester?: UnifiedTicketUser | null;
  host?: UnifiedTicketUser | null;
  guest?: UnifiedTicketUser | null;
  booking?: {
    id: number;
    pickup_at?: string;
    return_at?: string;
    total_amount?: number;
    status?: number;
    booking_vehicle?: { id: number; make?: string; model?: string; year?: number; license_plate_number?: string };
    booking_inspections?: { id: number; type: number; attachments?: unknown; createdAt?: string }[];
  } | null;
  vehicle?: { id: number; make?: string; model?: string; year?: number; license_plate_number?: string } | null;
  claim?: {
    id: number;
    claim_type?: string;
    claim_type_label?: string;
    amount?: number;
    direction?: string;
    description?: string;
    attachments?: unknown;
    status?: number;
    can_counter?: boolean;
    pending_counter?: UnifiedTicketPendingCounter | null;
  } | null;
  pending_counter?: UnifiedTicketPendingCounter | null;
  can_approve?: boolean;
  can_waive?: boolean;
  can_counter?: boolean;
  can_approve_counter?: boolean;
  can_reject_counter?: boolean;
  timeline?: UnifiedTicketTimelineItem[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

function unwrapList(data: unknown): AdminUnifiedTicket[] {
  if (Array.isArray(data)) return data as AdminUnifiedTicket[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: AdminUnifiedTicket[] }).data;
  }
  return [];
}

export async function listUnifiedTickets(): Promise<AdminUnifiedTicket[]> {
  const json = await adminFetch<ApiSuccess<unknown>>("/api/admin/unified-ticket?page=1&limit=100", {
    method: "GET",
    auth: true,
  });
  return unwrapList(json.data);
}

export async function getUnifiedTicket(id: number): Promise<AdminUnifiedTicket> {
  const json = await adminFetch<ApiSuccess<AdminUnifiedTicket>>(`/api/admin/unified-ticket/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export async function updateUnifiedTicket(
  id: number,
  body: {
    action?: string;
    amount?: number;
    admin_notes?: string | null;
    note?: string | null;
    event_id?: number;
    offer_event_id?: number;
  }
): Promise<AdminUnifiedTicket> {
  const json = await adminFetch<ApiSuccess<AdminUnifiedTicket>>(`/api/admin/unified-ticket/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
  return json.data;
}

export const unifiedTicketsQueryKeyRoot = ["admin", "unified-tickets"] as const;
export const unifiedTicketsListQueryKey = [...unifiedTicketsQueryKeyRoot, "list"] as const;
export function unifiedTicketDetailQueryKey(id: number) {
  return [...unifiedTicketsQueryKeyRoot, "detail", id] as const;
}
