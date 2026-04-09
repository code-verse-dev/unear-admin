import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const FAQS_PAGE_SIZE_DEFAULT = 15;

export type AdminFaq = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type FaqsListParams = {
  page: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildFaqsQuery(params: FaqsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? FAQS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.search?.trim()) sp.set("search", params.search.trim());
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type FaqsListResult = {
  rows: AdminFaq[];
  links: PaginationLinks | null;
};

export async function listFaqs(params: FaqsListParams): Promise<FaqsListResult> {
  const json = await adminFetch<ApiSuccess<AdminFaq[]> & { links?: PaginationLinks }>(
    `/api/admin/faq${buildFaqsQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getFaq(id: number): Promise<AdminFaq> {
  const json = await adminFetch<ApiSuccess<AdminFaq>>(`/api/admin/faq/${id}`, { method: "GET", auth: true });
  return json.data;
}

export type CreateFaqBody = { title: string; content: string };
export type UpdateFaqBody = { title: string; content: string };

export async function createFaq(body: CreateFaqBody): Promise<AdminFaq> {
  const json = await adminFetch<ApiSuccess<AdminFaq>>("/api/admin/faq", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function updateFaq(id: number, body: UpdateFaqBody): Promise<AdminFaq> {
  const json = await adminFetch<ApiSuccess<AdminFaq>>(`/api/admin/faq/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function deleteFaq(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/faq/${id}`, { method: "DELETE", auth: true });
}

export const faqsQueryKeyRoot = ["admin", "faqs"] as const;

export function faqsListQueryKey(params: FaqsListParams) {
  return [...faqsQueryKeyRoot, "list", params] as const;
}

export function faqDetailQueryKey(id: number) {
  return [...faqsQueryKeyRoot, "detail", id] as const;
}
