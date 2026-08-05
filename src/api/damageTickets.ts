import { adminFetch, resolveMediaUrl, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const DAMAGE_TICKETS_PAGE_SIZE_DEFAULT = 10;

/** Backend DAMAGE_SUPPORT_TICKET_STATUS */
export const DAMAGE_TICKET_STATUS = {
  OPEN: 10,
  IN_DISCUSSION: 20,
  AMOUNT_SET: 30,
  CHARGED: 40,
  CANCELLED: 50,
} as const;

export type DamageTicketUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  mobile_no?: string | null;
  image_url?: string | null;
  nickname?: string | null;
};

export type DamageTicketVehicle = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  license_plate_number?: string | null;
};

export type DamageTicketBooking = {
  id: number;
  vehicle_id?: number;
  pickup_at?: string;
  return_at?: string;
  actual_return_at?: string;
  status?: number;
  payment_method_id?: string | null;
  total_amount?: number;
  security_deposit?: number;
  vehicle?: DamageTicketVehicle | null;
};

export type AdminDamageTicket = {
  id: number;
  booking_id: number;
  booking_inspection_id: number;
  host_id: number;
  guest_id: number;
  assigned_admin_id: number | null;
  host_chat_room_id: number | null;
  guest_chat_room_id: number | null;
  proposed_amount: number;
  final_amount: number | null;
  damage_description: string | null;
  attachments: unknown;
  status: number;
  payment_intent_id: string | null;
  wallet_payment_amount: number;
  charged_at: string | null;
  admin_notes: string | null;
  host: DamageTicketUser | null;
  guest: DamageTicketUser | null;
  admin?: DamageTicketUser | null;
  booking: DamageTicketBooking | null;
  inspection?: {
    id: number;
    damage?: string;
    fine_amount?: number;
    attachments?: unknown;
  } | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type DamageTicketMessage = {
  chat_room_id: number;
  message_id: number;
  message_type: string;
  message: string;
  file_url?: string | string[] | null;
  file_name?: string | null;
  user_id: number;
  user_name?: string;
  user_image?: string | string[] | null;
  user_type?: string | null;
  message_timestamp: string;
};

export type DamageTicketsListParams = {
  page: number;
  limit?: number;
  search?: string;
  status?: number;
  booking_id?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildQuery(params: DamageTicketsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? DAMAGE_TICKETS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.status != null) sp.set("status", String(params.status));
  if (params.booking_id != null) sp.set("booking_id", String(params.booking_id));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type DamageTicketsListResult = {
  rows: AdminDamageTicket[];
  links: PaginationLinks | null;
};

export async function listDamageTickets(
  params: DamageTicketsListParams
): Promise<DamageTicketsListResult> {
  const json = await adminFetch<ApiSuccess<AdminDamageTicket[]> & { links?: PaginationLinks }>(
    `/api/admin/damage-ticket${buildQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getDamageTicket(id: number): Promise<AdminDamageTicket> {
  const json = await adminFetch<ApiSuccess<AdminDamageTicket>>(`/api/admin/damage-ticket/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type UpdateDamageTicketBody = {
  final_amount?: number;
  status?: number;
  admin_notes?: string | null;
};

export async function updateDamageTicket(
  id: number,
  body: UpdateDamageTicketBody
): Promise<AdminDamageTicket> {
  const json = await adminFetch<ApiSuccess<AdminDamageTicket>>(`/api/admin/damage-ticket/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function chargeDamageTicket(
  id: number,
  body: { final_amount?: number; wallet_amount?: number; admin_notes?: string | null } = {}
): Promise<AdminDamageTicket> {
  const json = await adminFetch<ApiSuccess<AdminDamageTicket>>(
    `/api/admin/damage-ticket/${id}/charge`,
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export type DamageTicketMessagesResult = {
  ticket_id: number;
  room: "host" | "guest";
  chat_room_id: number;
  pagination: { page: number; limit: number; total: number };
  messages: DamageTicketMessage[];
};

export async function getDamageTicketMessages(
  id: number,
  room: "host" | "guest",
  page = 1,
  limit = 100
): Promise<DamageTicketMessagesResult> {
  const sp = new URLSearchParams({
    room,
    page: String(page),
    limit: String(limit),
  });
  const json = await adminFetch<ApiSuccess<DamageTicketMessagesResult>>(
    `/api/admin/damage-ticket/${id}/messages?${sp.toString()}`,
    { method: "GET", auth: true }
  );
  return json.data;
}

export async function sendDamageTicketMessage(
  id: number,
  body: { room: "host" | "guest"; message: string }
): Promise<DamageTicketMessage> {
  const json = await adminFetch<ApiSuccess<DamageTicketMessage>>(
    `/api/admin/damage-ticket/${id}/messages`,
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export const damageTicketsQueryKeyRoot = ["admin", "damage-tickets"] as const;

export function damageTicketsListQueryKey(params: DamageTicketsListParams) {
  return [...damageTicketsQueryKeyRoot, "list", params] as const;
}

export function damageTicketDetailQueryKey(id: number) {
  return [...damageTicketsQueryKeyRoot, "detail", id] as const;
}

export function damageTicketMessagesQueryKey(id: number, room: "host" | "guest") {
  return [...damageTicketsQueryKeyRoot, "messages", id, room] as const;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;

function rawAttachmentStrings(attachments: unknown): string[] {
  if (!Array.isArray(attachments)) return [];
  const out: string[] = [];
  for (const item of attachments) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
    } else if (
      item &&
      typeof item === "object" &&
      "url" in item &&
      typeof (item as { url: unknown }).url === "string"
    ) {
      const t = String((item as { url: string }).url).trim();
      if (t) out.push(t);
    }
  }
  return out;
}

export function damageTicketAttachmentUrls(
  ticket: Pick<AdminDamageTicket, "attachments">
): string[] {
  return rawAttachmentStrings(ticket.attachments)
    .map((u) => resolveMediaUrl(u))
    .filter((u): u is string => Boolean(u));
}

export function firstDamageTicketImageUrl(
  ticket: Pick<AdminDamageTicket, "attachments">
): string | undefined {
  for (const u of damageTicketAttachmentUrls(ticket)) {
    if (IMAGE_EXT.test(u)) return u;
  }
  return undefined;
}

export function isDamageTicketImageUrl(u: string): boolean {
  return IMAGE_EXT.test(u);
}
