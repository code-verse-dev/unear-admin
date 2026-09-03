import { adminFetch, resolveMediaUrl, type ApiSuccess } from "@/lib/admin-api";

export const TRIP_EXTRAS_PAGE_SIZE_DEFAULT = 10;

export const BOOKING_INVOICE_STATUS = {
  DRAFT: "draft",
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  DISPUTED: "disputed",
  WAIVED: "waived",
  CANCELLED: "cancelled",
} as const;

export type BookingInvoiceStatus =
  (typeof BOOKING_INVOICE_STATUS)[keyof typeof BOOKING_INVOICE_STATUS];

export type AdminBookingInvoiceItem = {
  id: number;
  charge_type: string;
  is_system: boolean;
  title: string;
  description: string | null;
  amount: number;
  attachments: unknown;
  sort_order: number;
};

export type AdminBookingInvoice = {
  id: number;
  booking_id: number;
  guest_id: number;
  host_id: number;
  status: string;
  note: string | null;
  subtotal: number;
  platform_cut: number;
  host_amount: number;
  total_amount: number;
  dispute_note: string | null;
  wallet_payment_amount: number;
  sent_at: string | null;
  paid_at: string | null;
  items: AdminBookingInvoiceItem[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type BookingInvoicesListParams = {
  status?: string;
};

export async function listBookingInvoices(
  params: BookingInvoicesListParams = {}
): Promise<AdminBookingInvoice[]> {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "open") sp.set("status", params.status);
  const q = sp.toString();
  const json = await adminFetch<ApiSuccess<AdminBookingInvoice[]>>(
    `/api/admin/booking-invoices${q ? `?${q}` : ""}`,
    { method: "GET", auth: true }
  );
  return Array.isArray(json.data) ? json.data : [];
}

export async function getBookingInvoice(id: number): Promise<AdminBookingInvoice> {
  const json = await adminFetch<ApiSuccess<AdminBookingInvoice>>(`/api/admin/booking-invoices/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type UpdateBookingInvoiceBody = {
  action: "confirm" | "deny" | "waive" | "counter" | "set_amount";
  amount?: number;
  note?: string | null;
};

export async function updateBookingInvoice(
  id: number,
  body: UpdateBookingInvoiceBody
): Promise<AdminBookingInvoice> {
  const json = await adminFetch<ApiSuccess<AdminBookingInvoice>>(`/api/admin/booking-invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export const bookingInvoicesQueryKeyRoot = ["admin", "booking-invoices"] as const;

export function bookingInvoicesListQueryKey(params: BookingInvoicesListParams) {
  return [...bookingInvoicesQueryKeyRoot, "list", params] as const;
}

export function bookingInvoiceDetailQueryKey(id: number) {
  return [...bookingInvoicesQueryKeyRoot, "detail", id] as const;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;

function rawAttachmentStrings(attachments: unknown): string[] {
  if (!Array.isArray(attachments)) return [];
  const out: string[] = [];
  for (const item of attachments) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
    } else if (item && typeof item === "object" && "url" in item && typeof (item as { url: unknown }).url === "string") {
      const t = String((item as { url: string }).url).trim();
      if (t) out.push(t);
    }
  }
  return out;
}

export function invoiceItemAttachmentUrls(item: Pick<AdminBookingInvoiceItem, "attachments">): string[] {
  return rawAttachmentStrings(item.attachments)
    .map((u) => resolveMediaUrl(u))
    .filter((u): u is string => Boolean(u));
}

export function isInvoiceImageUrl(u: string): boolean {
  return IMAGE_EXT.test(u);
}

export function extrasStatusLabel(s: string): string {
  switch (s) {
    case BOOKING_INVOICE_STATUS.PENDING_PAYMENT:
      return "Pending payment";
    case BOOKING_INVOICE_STATUS.DISPUTED:
      return "Disputed";
    case BOOKING_INVOICE_STATUS.PAID:
      return "Paid";
    case BOOKING_INVOICE_STATUS.WAIVED:
      return "Waived";
    case BOOKING_INVOICE_STATUS.DRAFT:
      return "Draft";
    case BOOKING_INVOICE_STATUS.CANCELLED:
      return "Cancelled";
    default:
      return s || "—";
  }
}

export function extrasStatusVariant(
  s: string
): "success" | "warning" | "destructive" | "default" | "secondary" | "info" {
  if (s === BOOKING_INVOICE_STATUS.PAID || s === BOOKING_INVOICE_STATUS.WAIVED) return "success";
  if (s === BOOKING_INVOICE_STATUS.DISPUTED) return "warning";
  if (s === BOOKING_INVOICE_STATUS.CANCELLED) return "destructive";
  if (s === BOOKING_INVOICE_STATUS.PENDING_PAYMENT) return "info";
  return "secondary";
}

export function extrasIsOpen(s: string): boolean {
  return s === BOOKING_INVOICE_STATUS.PENDING_PAYMENT || s === BOOKING_INVOICE_STATUS.DISPUTED;
}
