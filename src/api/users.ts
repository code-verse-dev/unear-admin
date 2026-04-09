import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

/** Default page size for admin users list (must match `limit` sent to the API). */
export const USERS_PAGE_SIZE_DEFAULT = 10;

export type PaginationLinks = {
  total: number;
  per_page: number;
  current: number;
  prev: number;
  next: number;
  total_records: number;
};

export type AppUser = {
  id: number;
  firstname: string;
  lastname: string;
  name: string;
  nickname: string;
  email: string;
  mobile_no: string | null;
  image_url: string | null;
  about: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  zipcode: string | null;
  average_rating: number;
  push_notification: boolean;
  is_blocked: boolean;
  is_activated: boolean;
  is_verified: boolean;
  createdAt: string;
  id_card_front?: string | null;
  id_card_back?: string | null;
  driving_license_front?: string | null;
  driving_license_back?: string | null;
};

export type UsersListParams = {
  page: number;
  limit?: number;
  search?: string;
  /** Combined account filter for simpler UX */
  accountStatus?: "all" | "active" | "blocked" | "deactivated";
  verification?: "all" | "verified" | "pending";
  /** Sort field (backend RestModel). Default id. */
  orderBy?: string;
  /** ASC | DESC. Default ASC (lowest id first). */
  order?: "ASC" | "DESC";
};

function buildUsersQuery(params: UsersListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? USERS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "ASC");
  if (params.search?.trim()) sp.set("search", params.search.trim());

  if (params.accountStatus === "active") {
    sp.set("is_blocked", "0");
    sp.set("is_activated", "1");
  } else if (params.accountStatus === "blocked") {
    sp.set("is_blocked", "1");
  } else if (params.accountStatus === "deactivated") {
    sp.set("is_activated", "0");
    sp.set("is_blocked", "0");
  }

  if (params.verification === "verified") sp.set("is_verified", "1");
  if (params.verification === "pending") sp.set("is_verified", "0");

  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type UsersListResult = {
  rows: AppUser[];
  links: PaginationLinks | null;
};

export async function listUsers(params: UsersListParams): Promise<UsersListResult> {
  const json = await adminFetch<ApiSuccess<AppUser[]> & { links?: PaginationLinks }>(
    `/api/admin/users${buildUsersQuery(params)}`,
    { method: "GET", auth: true }
  );
  return {
    rows: Array.isArray(json.data) ? json.data : [],
    links: json.links ?? null,
  };
}

export async function getUser(id: number): Promise<AppUser> {
  const json = await adminFetch<ApiSuccess<AppUser>>(`/api/admin/users/${id}`, {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export type UpdateUserBody = {
  firstname?: string;
  lastname?: string;
  nickname?: string;
  name?: string;
  is_activated?: boolean;
};

export async function updateUser(
  id: number,
  body: UpdateUserBody,
  avatarFile?: File | null
): Promise<AppUser> {
  if (avatarFile) {
    const fd = new FormData();
    if (body.firstname != null) fd.append("firstname", body.firstname);
    if (body.lastname != null) fd.append("lastname", body.lastname);
    if (body.nickname != null && body.nickname.trim() !== "") fd.append("nickname", body.nickname.trim());
    if (body.is_activated != null) fd.append("is_activated", body.is_activated ? "true" : "false");
    fd.append("image", avatarFile);
    const json = await adminFetch<ApiSuccess<AppUser>>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: fd,
      auth: true,
    });
    return json.data;
  }

  const json = await adminFetch<ApiSuccess<AppUser>>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    auth: true,
  });
  return json.data;
}

export async function deleteUser(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/users/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function blockUser(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/block-user/${id}`, {
    method: "POST",
    body: JSON.stringify({}),
    auth: true,
  });
}

export async function unblockUser(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/unblock-user/${id}`, {
    method: "POST",
    body: JSON.stringify({}),
    auth: true,
  });
}

export async function setUserPassword(id: number, new_password: string): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/change-user-password/${id}`, {
    method: "POST",
    body: JSON.stringify({ new_password }),
    auth: true,
  });
}

export async function toggleUserVerification(id: number): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>(`/api/admin/update-user-verification/${id}`, {
    method: "GET",
    auth: true,
  });
}

/** Page size for infinite-scroll pickers (push notifications, etc.). */
export const USERS_INFINITE_PAGE_SIZE = 25;

export const usersQueryKeyRoot = ["admin", "users"] as const;

export function usersListQueryKey(params: UsersListParams) {
  return [...usersQueryKeyRoot, "list", params] as const;
}

export function usersInfiniteListQueryKey(debouncedSearch: string) {
  return [...usersQueryKeyRoot, "infinite", debouncedSearch] as const;
}

export function userDetailQueryKey(id: number) {
  return [...usersQueryKeyRoot, "detail", id] as const;
}
