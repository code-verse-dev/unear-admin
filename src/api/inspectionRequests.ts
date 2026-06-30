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
  /** Required on new host bookings; ties platform inspection + compliance to one rental vehicle. */
  vehicle_id: number | null;
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
  report_url?: string | null;
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

export async function deleteInspectionRequest(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/inspection-request/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export const inspectionRequestsQueryKeyRoot = ["admin", "inspection-requests"] as const;

export function inspectionRequestsListQueryKey(params: InspectionRequestsListParams) {
  return [...inspectionRequestsQueryKeyRoot, "list", params] as const;
}

export function inspectionRequestDetailQueryKey(id: number) {
  return [...inspectionRequestsQueryKeyRoot, "detail", id] as const;
}

/** Normalize API value to a list of slots (handles JSON strings and single objects). */
export function normalizeInspectionAvailability(av: unknown): unknown[] {
  if (av == null) return [];
  if (typeof av === "string") {
    const t = av.trim();
    if (!t) return [];
    try {
      return normalizeInspectionAvailability(JSON.parse(t));
    } catch {
      return [t];
    }
  }
  if (Array.isArray(av)) return av;
  if (typeof av === "object") return [av];
  return [String(av)];
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== "" && typeof v !== "object") return String(v);
  }
  return "";
}

/** Format "09:00" / "9:30" for display (en-US 12h). */
export function formatInspectionTimeHm(hm: string): string {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(hm.trim());
  if (!m) return hm.trim();
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (!Number.isFinite(h) || h < 0 || h > 23) return hm.trim();
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${ap}`;
}

function formatInspectionSlotEntry(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  if (typeof x !== "object" || Array.isArray(x)) return JSON.stringify(x);

  const o = x as Record<string, unknown>;
  const day = pickString(o, ["day", "weekday", "dayOfWeek", "day_name", "date"]);
  const from = pickString(o, ["from", "start", "start_time", "pickup_start_time", "time_from", "open"]);
  const to = pickString(o, ["to", "end", "end_time", "pickup_end_time", "time_to", "close"]);

  if (from && to) {
    const range = `${formatInspectionTimeHm(from)} – ${formatInspectionTimeHm(to)}`;
    return day ? `${day}: ${range}` : range;
  }
  if (day && (from || to)) {
    const t = from || to;
    return `${day}: ${formatInspectionTimeHm(t)}`;
  }
  if (day) return day;

  const entries = Object.entries(o).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => {
      if (typeof v === "object") return `${k}: ${JSON.stringify(v)}`;
      return `${k}: ${String(v)}`;
    })
    .join(" · ");
}

/** One human-readable line per availability slot (for lists). */
export function inspectionAvailabilityLines(av: unknown): string[] {
  const raw = normalizeInspectionAvailability(av);
  const lines = raw.map(formatInspectionSlotEntry).map((s) => s.trim()).filter(Boolean);
  return lines;
}

/** Human-readable availability (JSON array / string / object from API). */
export function formatInspectionAvailability(av: unknown): string {
  const lines = inspectionAvailabilityLines(av);
  if (lines.length === 0) return "—";
  return lines.join("\n");
}

export function inspectionReportHref(reportUrl: string | null | undefined): string | null {
  if (!reportUrl?.trim()) return null;
  return resolveMediaUrl(reportUrl.trim());
}
