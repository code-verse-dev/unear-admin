import { adminFetch, resolveMediaUrl, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const CLAIMS_PAGE_SIZE_DEFAULT = 10;

/** Backend `ACCIDENT_EXPENSE_CLAIM_STATUS` */
export const EXPENSE_CLAIM_STATUS = {
  PENDING: 10,
  UNDER_REVIEW: 20,
  APPROVED: 30,
  REJECTED: 40,
  PAID: 50,
} as const;

/** Backend `ACCIDENT_EXPENSE_TYPE` */
export const EXPENSE_CLAIM_TYPE = {
  DAMAGE_COMPENSATION: 10,
  TOWING_FEES: 20,
  GAS_REIMBURSEMENT: 30,
  TOLL_REIMBURSEMENT: 40,
} as const;

export type ExpenseClaimUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  mobile_no?: string | null;
  image_url?: string | null;
};

export type ExpenseClaimVehicle = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  license_plate_number?: string | null;
};

export type ExpenseClaimBooking = {
  id: number;
  pickup_at?: string;
  return_at?: string;
  status?: number;
};

export type AdminExpenseClaim = {
  id: number;
  user_id: number;
  vehicle_id: number | null;
  booking_id: number | null;
  expense_type: number;
  amount: number;
  description: string | null;
  accident_date: string;
  accident_location: string | null;
  attachments: unknown;
  admin_notes: string | null;
  status: number;
  user: ExpenseClaimUser | null;
  vehicle: ExpenseClaimVehicle | null;
  booking?: ExpenseClaimBooking | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type ExpenseClaimsListParams = {
  page: number;
  limit?: number;
  /** Admin: server-side search (id, user, email, vehicle, description, location). */
  search?: string;
  status?: number;
  expense_type?: number;
  vehicle_id?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildExpenseClaimsQuery(params: ExpenseClaimsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? CLAIMS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.status != null) sp.set("status", String(params.status));
  if (params.expense_type != null) sp.set("expense_type", String(params.expense_type));
  if (params.vehicle_id != null) sp.set("vehicle_id", String(params.vehicle_id));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type ExpenseClaimsListResult = {
  rows: AdminExpenseClaim[];
  links: PaginationLinks | null;
};

export async function listExpenseClaims(
  params: ExpenseClaimsListParams
): Promise<ExpenseClaimsListResult> {
  const json = await adminFetch<ApiSuccess<AdminExpenseClaim[]> & { links?: PaginationLinks }>(
    `/api/admin/expense-claim${buildExpenseClaimsQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getExpenseClaim(id: number): Promise<AdminExpenseClaim> {
  const json = await adminFetch<ApiSuccess<AdminExpenseClaim>>(`/api/admin/expense-claim/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export async function approveExpenseClaim(id: number, body: { admin_notes?: string | null } = {}) {
  const json = await adminFetch<ApiSuccess<AdminExpenseClaim>>(
    `/api/admin/expense-claim/${id}/approve`,
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export async function rejectExpenseClaim(id: number, body: { admin_notes?: string | null } = {}) {
  const json = await adminFetch<ApiSuccess<AdminExpenseClaim>>(
    `/api/admin/expense-claim/${id}/reject`,
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export async function markExpenseClaimPaid(id: number, body: { admin_notes?: string | null } = {}) {
  const json = await adminFetch<ApiSuccess<AdminExpenseClaim>>(
    `/api/admin/expense-claim/${id}/mark-paid`,
    { method: "POST", body: JSON.stringify(body), auth: true }
  );
  return json.data;
}

export type UpdateExpenseClaimBody = {
  admin_notes?: string | null;
  status?: number;
};

export async function updateExpenseClaim(
  id: number,
  body: UpdateExpenseClaimBody
): Promise<AdminExpenseClaim> {
  const json = await adminFetch<ApiSuccess<AdminExpenseClaim>>(`/api/admin/expense-claim/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export const expenseClaimsQueryKeyRoot = ["admin", "expense-claims"] as const;

export function expenseClaimsListQueryKey(params: ExpenseClaimsListParams) {
  return [...expenseClaimsQueryKeyRoot, "list", params] as const;
}

export function expenseClaimDetailQueryKey(id: number) {
  return [...expenseClaimsQueryKeyRoot, "detail", id] as const;
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

/** Resolved URLs for claim attachments (API returns paths or full URLs unchanged in payload). */
export function claimAttachmentUrls(claim: Pick<AdminExpenseClaim, "attachments">): string[] {
  return rawAttachmentStrings(claim.attachments)
    .map((u) => resolveMediaUrl(u))
    .filter((u): u is string => Boolean(u));
}

export function firstClaimImageUrl(claim: Pick<AdminExpenseClaim, "attachments">): string | undefined {
  for (const u of claimAttachmentUrls(claim)) {
    if (IMAGE_EXT.test(u)) return u;
  }
  return undefined;
}
