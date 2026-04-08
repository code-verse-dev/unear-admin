import { adminFetch, resolveMediaUrl, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const VEHICLES_PAGE_SIZE_DEFAULT = 10;

/** Matches backend `VEHICLE_STATUS` (integer). */
export const VEHICLE_STATUS = {
  AVAILABLE: 10,
  RESERVED: 15,
  TOKEN_PAID: 25,
  SOLD: 20,
  RENTED: 30,
} as const;

export type VehicleOwner = {
  id: number;
  firstname?: string;
  lastname?: string;
  image_url?: string | null;
  average_rating?: number;
  createdAt?: string;
};

/** From listing API `attachments` (vehicle_attachments). */
export type VehicleAttachment = {
  type?: number;
  media_type?: string;
  media_url?: string | null;
  thumbnail_url?: string | null;
};

export type AdminVehicle = {
  id: number;
  user_id: number;
  type: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: number;
  blocked_by_admin: number;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  price?: number;
  license_plate_number?: string | null;
  license_plate_state?: string | null;
  color?: string | null;
  createdAt: string;
  owner: VehicleOwner | null;
  attachments?: VehicleAttachment[];
  [key: string]: unknown;
};

export type VehiclesListParams = {
  page: number;
  limit?: number;
  search?: string;
  /** Admin-only: list vehicles for this owner. */
  userId?: number;
  /** Vehicle workflow status (backend numeric). */
  status?: "all" | "available" | "reserved" | "token_paid" | "sold" | "rented";
  /** Admin-only: blocked_by_admin filter */
  restricted?: "all" | "yes" | "no";
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildVehiclesQuery(params: VehiclesListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? VEHICLES_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "ASC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.userId != null) sp.set("user_id", String(params.userId));

  if (params.status === "available") sp.set("status", String(VEHICLE_STATUS.AVAILABLE));
  else if (params.status === "reserved") sp.set("status", String(VEHICLE_STATUS.RESERVED));
  else if (params.status === "token_paid") sp.set("status", String(VEHICLE_STATUS.TOKEN_PAID));
  else if (params.status === "sold") sp.set("status", String(VEHICLE_STATUS.SOLD));
  else if (params.status === "rented") sp.set("status", String(VEHICLE_STATUS.RENTED));

  if (params.restricted === "yes") sp.set("blocked_by_admin", "1");
  else if (params.restricted === "no") sp.set("blocked_by_admin", "0");

  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type VehiclesListResult = {
  rows: AdminVehicle[];
  links: PaginationLinks | null;
};

export async function listVehicles(params: VehiclesListParams): Promise<VehiclesListResult> {
  const json = await adminFetch<ApiSuccess<AdminVehicle[]> & { links?: PaginationLinks }>(
    `/api/admin/vehicle${buildVehiclesQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getVehicle(id: number): Promise<AdminVehicle> {
  const json = await adminFetch<ApiSuccess<AdminVehicle>>(`/api/admin/vehicle/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

/** Admin PATCH body: any subset for quick toggles, or full scalars for edit form. */
export type UpdateVehicleBody = {
  blocked_by_admin?: number | boolean;
  type?: number;
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
  older_vehicle?: number | boolean;
  fuel_type?: string;
  transmission?: string;
  engine_cc?: number;
  fuel_tank_capacity?: number;
  color?: string | null;
  seats?: number;
  mileage?: string;
  horsepower?: string;
  car_type?: string;
  eco_friendly?: string;
  car_class?: string;
  price?: number;
  address?: string;
  country?: string | null;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  branded_or_salvage_title?: number | boolean;
  tax_paid?: number | boolean;
  license_plate_number?: string;
  license_plate_state?: string;
  description?: string | null;
  instructions?: string | null;
  status?: number;
};

export async function updateVehicle(id: number, body: UpdateVehicleBody): Promise<AdminVehicle> {
  const json = await adminFetch<ApiSuccess<AdminVehicle>>(`/api/admin/vehicle/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export const vehiclesQueryKeyRoot = ["admin", "vehicles"] as const;

export function vehiclesListQueryKey(params: VehiclesListParams) {
  return [...vehiclesQueryKeyRoot, "list", params] as const;
}

export function vehicleDetailQueryKey(id: number) {
  return [...vehiclesQueryKeyRoot, "detail", id] as const;
}

/** Image URLs for admin table / gallery (skips video & document attachments). */
export function vehicleListingImageUrls(v: AdminVehicle): string[] {
  const raw = v.attachments;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => {
      const mt = String(a?.media_type ?? "").toLowerCase();
      if (mt === "video" || mt === "document") return false;
      return Boolean(a?.thumbnail_url || a?.media_url);
    })
    .map((a) => String(a.thumbnail_url || a.media_url || "").trim())
    .filter(Boolean)
    .map((url) => resolveMediaUrl(url))
    .filter((u): u is string => Boolean(u));
}
