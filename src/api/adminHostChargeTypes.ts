import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const HOST_CHARGE_TYPES_PAGE_SIZE_DEFAULT = 20;

export type WindowUnit = "hours" | "months";

export type AdminHostChargeType = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  window_value: number;
  window_unit: WindowUnit | string;
  for_host: boolean;
  for_guest: boolean;
  is_active: boolean;
  sort_order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type HostChargeTypesListParams = {
  page: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildQuery(params: HostChargeTypesListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? HOST_CHARGE_TYPES_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "sort_order");
  sp.set("order", params.order ?? "ASC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type HostChargeTypesListResult = {
  rows: AdminHostChargeType[];
  links: PaginationLinks | null;
};

export async function listHostChargeTypes(
  params: HostChargeTypesListParams
): Promise<HostChargeTypesListResult> {
  const json = await adminFetch<ApiSuccess<AdminHostChargeType[]> & { links?: PaginationLinks }>(
    `/api/admin/host-charge-types${buildQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export type HostChargeTypeBody = {
  name: string;
  slug?: string;
  description?: string | null;
  base_price: number;
  window_value: number;
  window_unit: WindowUnit;
  for_host: boolean;
  for_guest: boolean;
  is_active: boolean;
  sort_order: number;
};

export async function createHostChargeType(body: HostChargeTypeBody): Promise<AdminHostChargeType> {
  const json = await adminFetch<ApiSuccess<AdminHostChargeType>>("/api/admin/host-charge-types", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function updateHostChargeType(
  id: number,
  body: HostChargeTypeBody
): Promise<AdminHostChargeType> {
  const json = await adminFetch<ApiSuccess<AdminHostChargeType>>(`/api/admin/host-charge-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function deleteHostChargeType(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/host-charge-types/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export const hostChargeTypesQueryKeyRoot = ["admin", "host-charge-types"] as const;

export function hostChargeTypesListQueryKey(params: HostChargeTypesListParams) {
  return [...hostChargeTypesQueryKeyRoot, "list", params] as const;
}
