import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const PAGES_PAGE_SIZE_DEFAULT = 15;

export type AdminContentPage = {
  id: number;
  title: string;
  slug: string;
  content: string;
  url: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PagesListParams = {
  page: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildPagesQuery(params: PagesListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? PAGES_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type PagesListResult = {
  rows: AdminContentPage[];
  links: PaginationLinks | null;
};

export async function listPages(params: PagesListParams): Promise<PagesListResult> {
  const json = await adminFetch<ApiSuccess<AdminContentPage[]> & { links?: PaginationLinks }>(
    `/api/admin/page${buildPagesQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getPage(id: number): Promise<AdminContentPage> {
  const json = await adminFetch<ApiSuccess<AdminContentPage>>(`/api/admin/page/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type CreatePageBody = { title: string; content: string; url?: string | null };
export type UpdatePageBody = { title: string; content: string; url?: string | null };

export async function createPage(body: CreatePageBody): Promise<AdminContentPage> {
  const json = await adminFetch<ApiSuccess<AdminContentPage>>("/api/admin/page", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function updatePage(id: number, body: UpdatePageBody): Promise<AdminContentPage> {
  const json = await adminFetch<ApiSuccess<AdminContentPage>>(`/api/admin/page/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function deletePage(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/page/${id}`, { method: "DELETE", auth: true });
}

export const pagesQueryKeyRoot = ["admin", "content-pages"] as const;

export function pagesListQueryKey(params: PagesListParams) {
  return [...pagesQueryKeyRoot, "list", params] as const;
}

export function pageDetailQueryKey(id: number) {
  return [...pagesQueryKeyRoot, "detail", id] as const;
}
