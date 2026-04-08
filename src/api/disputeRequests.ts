import { adminFetch, resolveMediaUrl, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const DISPUTES_PAGE_SIZE_DEFAULT = 10;

/** Backend `DISPUTE_REQUEST_STATUS` */
export const DISPUTE_REQUEST_STATUS = {
  REQUESTED: 10,
  COMPLETED: 20,
  CANCELLED: 30,
} as const;

export type DisputeRequestUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  image_url?: string | null;
};

export type AdminDisputeRequest = {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  category: string;
  description: string | null;
  car_model_year: string;
  transaction_id: number;
  transaction_date: string;
  preferred_resolution: string;
  attachments: unknown;
  status: number;
  user: DisputeRequestUser | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type DisputeRequestsListParams = {
  page: number;
  limit?: number;
  search?: string;
  /** Numeric status or "all" omitted */
  status?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildDisputeRequestsQuery(params: DisputeRequestsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? DISPUTES_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.status != null) sp.set("status", String(params.status));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type DisputeRequestsListResult = {
  rows: AdminDisputeRequest[];
  links: PaginationLinks | null;
};

export async function listDisputeRequests(
  params: DisputeRequestsListParams
): Promise<DisputeRequestsListResult> {
  const json = await adminFetch<ApiSuccess<AdminDisputeRequest[]> & { links?: PaginationLinks }>(
    `/api/admin/dispute-request${buildDisputeRequestsQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getDisputeRequest(id: number): Promise<AdminDisputeRequest> {
  const json = await adminFetch<ApiSuccess<AdminDisputeRequest>>(`/api/admin/dispute-request/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type UpdateDisputeRequestBody = {
  status?: number;
};

export async function updateDisputeRequest(
  id: number,
  body: UpdateDisputeRequestBody
): Promise<AdminDisputeRequest> {
  const json = await adminFetch<ApiSuccess<AdminDisputeRequest>>(`/api/admin/dispute-request/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export const disputeRequestsQueryKeyRoot = ["admin", "dispute-requests"] as const;

export function disputeRequestsListQueryKey(params: DisputeRequestsListParams) {
  return [...disputeRequestsQueryKeyRoot, "list", params] as const;
}

export function disputeRequestDetailQueryKey(id: number) {
  return [...disputeRequestsQueryKeyRoot, "detail", id] as const;
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

export function disputeAttachmentUrls(dispute: Pick<AdminDisputeRequest, "attachments">): string[] {
  return rawAttachmentStrings(dispute.attachments)
    .map((u) => resolveMediaUrl(u))
    .filter((u): u is string => Boolean(u));
}

export function firstDisputeImageUrl(dispute: Pick<AdminDisputeRequest, "attachments">): string | undefined {
  for (const u of disputeAttachmentUrls(dispute)) {
    if (IMAGE_EXT.test(u)) return u;
  }
  return undefined;
}
