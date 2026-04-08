import { adminFetch, resolveMediaUrl, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const INSPECTIONS_PAGE_SIZE_DEFAULT = 10;

/** Backend `INSPECTION_REQUEST_STATUS` */
export const INSPECTION_REQUEST_STATUS = {
  UNPAID: 10,
  REQUESTED: 20,
  COMPLETED: 30,
  CANCELLED: 40,
} as const;

export type InspectionRequestUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  image_url?: string | null;
};

export type AdminInspectionRequest = {
  id: number;
  user_id: number;
  car_name: string;
  car_type: string;
  horsepower: number;
  model: string;
  color: string;
  availability: unknown;
  charges: number;
  report_url: string | null;
  payment_intent_id: string;
  status: number;
  user: InspectionRequestUser | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type InspectionRequestsListParams = {
  page: number;
  limit?: number;
  search?: string;
  status?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildInspectionRequestsQuery(params: InspectionRequestsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? INSPECTIONS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.status != null) sp.set("status", String(params.status));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type InspectionRequestsListResult = {
  rows: AdminInspectionRequest[];
  links: PaginationLinks | null;
};

export async function listInspectionRequests(
  params: InspectionRequestsListParams
): Promise<InspectionRequestsListResult> {
  const json = await adminFetch<ApiSuccess<AdminInspectionRequest[]> & { links?: PaginationLinks }>(
    `/api/admin/inspection-request${buildInspectionRequestsQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getInspectionRequest(id: number): Promise<AdminInspectionRequest> {
  const json = await adminFetch<ApiSuccess<AdminInspectionRequest>>(`/api/admin/inspection-request/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type UpdateInspectionRequestBody = {
  status?: number;
};

export async function updateInspectionRequest(
  id: number,
  body: UpdateInspectionRequestBody
): Promise<AdminInspectionRequest> {
  const json = await adminFetch<ApiSuccess<AdminInspectionRequest>>(`/api/admin/inspection-request/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export const inspectionRequestsQueryKeyRoot = ["admin", "inspection-requests"] as const;

export function inspectionRequestsListQueryKey(params: InspectionRequestsListParams) {
  return [...inspectionRequestsQueryKeyRoot, "list", params] as const;
}

export function inspectionRequestDetailQueryKey(id: number) {
  return [...inspectionRequestsQueryKeyRoot, "detail", id] as const;
}

/** Human-readable availability (JSON array from API). */
export function formatInspectionAvailability(av: unknown): string {
  if (av == null) return "—";
  if (Array.isArray(av)) {
    if (av.length === 0) return "—";
    return av
      .map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") return JSON.stringify(x);
        return String(x);
      })
      .join("\n");
  }
  if (typeof av === "string") return av;
  return JSON.stringify(av);
}

export function inspectionReportHref(reportUrl: string | null | undefined): string | null {
  if (!reportUrl?.trim()) return null;
  return resolveMediaUrl(reportUrl.trim());
}
