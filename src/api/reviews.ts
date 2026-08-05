import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const REVIEWS_PAGE_SIZE_DEFAULT = 10;

export const REVIEW_INSTANCE_TYPE = {
  BOOKING: 10,
  PURCHASE: 20,
} as const;

export const REVIEW_ROLE = {
  GUEST: "guest",
  HOST: "host",
} as const;

export type ReviewUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  name?: string;
  image_url?: string | null;
  average_rating?: number;
};

export type AdminReview = {
  id: number;
  user_id: number;
  seller_id: number;
  vehicle_id: number | null;
  instance_type: number;
  instance_id: number;
  reviewer_role: string;
  review: string | null;
  rating: number | null;
  host_rating: number | null;
  vehicle_rating: number | null;
  host_review: string | null;
  vehicle_review: string | null;
  is_split_review: boolean;
  is_host_reviewing_guest: boolean;
  effective_host_rating: number | null;
  effective_vehicle_rating: number | null;
  effective_guest_rating: number | null;
  is_public: boolean;
  user: ReviewUser | null;
  seller: ReviewUser | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type ReviewsListParams = {
  page: number;
  limit?: number;
  search?: string;
  reviewer_role?: string;
  is_public?: string;
  instance_type?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildReviewsQuery(params: ReviewsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? REVIEWS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.reviewer_role && params.reviewer_role !== "all") {
    sp.set("reviewer_role", params.reviewer_role);
  }
  if (params.is_public && params.is_public !== "all") {
    sp.set("is_public", params.is_public);
  }
  if (params.instance_type != null) sp.set("instance_type", String(params.instance_type));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type ReviewsListResult = {
  rows: AdminReview[];
  links: PaginationLinks | null;
};

export async function listReviews(params: ReviewsListParams): Promise<ReviewsListResult> {
  const json = await adminFetch<ApiSuccess<AdminReview[]> & { links?: PaginationLinks }>(
    `/api/admin/review${buildReviewsQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getReview(id: number): Promise<AdminReview> {
  const json = await adminFetch<ApiSuccess<AdminReview>>(`/api/admin/review/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type UpdateReviewBody = {
  is_public?: boolean;
};

export async function updateReview(id: number, body: UpdateReviewBody): Promise<AdminReview> {
  const json = await adminFetch<ApiSuccess<AdminReview>>(`/api/admin/review/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function deleteReview(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/review/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export const reviewsQueryKeyRoot = ["admin", "reviews"] as const;

export function reviewsListQueryKey(params: ReviewsListParams) {
  return [...reviewsQueryKeyRoot, "list", params] as const;
}

export function reviewDetailQueryKey(id: number) {
  return [...reviewsQueryKeyRoot, "detail", id] as const;
}

export function reviewUserLabel(u: ReviewUser | null | undefined, fallbackId?: number): string {
  if (!u) return fallbackId != null ? `User #${fallbackId}` : "—";
  const nick = (u.nickname || "").trim();
  if (nick) return nick;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.name || `User #${u.id}`;
}
