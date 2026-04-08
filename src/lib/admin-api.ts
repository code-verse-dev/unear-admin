import {
  clearAdminSession,
  getAdminSession,
  getOrCreateDeviceToken,
  setAdminSession,
  type AdminSession,
} from "./auth-session";

export type ApiSuccess<T> = { code: number; message: string; data: T };
export type ApiErrorBody = { code: number; message: string; data?: unknown };

export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL || "http://localhost:3038";
  return raw.replace(/\/$/, "");
}

const UPLOAD_LIKE_PATH = /^\/(user|categories|vehicle|expense-claims)(\/|$)/i;

function shouldRehostMediaUrl(u: URL, apiOrigin: string): boolean {
  if (u.origin === apiOrigin) return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1") return true;
  return UPLOAD_LIKE_PATH.test(u.pathname);
}

/**
 * Build a browser-loadable media URL using the same origin as admin API calls.
 * Fixes wrong backend BASE_URL (e.g. port 3000 vs 3038) and relative upload paths.
 * Leaves external URLs (OAuth avatars, CDNs) unchanged unless path looks like local uploads.
 */
export function resolveMediaUrl(input: string | null | undefined): string | undefined {
  if (input == null) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;

  const base = apiBase();
  let apiOrigin: string;
  try {
    apiOrigin = new URL(`${base}/`).origin;
  } catch {
    return s;
  }

  if (s.startsWith("//")) {
    try {
      const u = new URL(s, `${base}/`);
      if (shouldRehostMediaUrl(u, apiOrigin)) {
        return `${apiOrigin}${u.pathname}${u.search}${u.hash}`;
      }
      return u.href;
    } catch {
      return s;
    }
  }

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (shouldRehostMediaUrl(u, apiOrigin)) {
        return `${apiOrigin}${u.pathname}${u.search}${u.hash}`;
      }
      return s;
    } catch {
      return s;
    }
  }

  const path = s.startsWith("/") ? s : `/${s}`;
  return `${apiOrigin}${path}`;
}

function clientId(): string {
  return import.meta.env.VITE_CLIENT_ID || "";
}

export function getAuthAuthorizationHeader(): string | null {
  const s = getAdminSession();
  if (!s?.api_token) return null;
  return `Bearer ${s.api_token}`;
}

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  auth?: boolean;
};

/** Authenticated admin API request (add `token` + optional `Authorization`). */
export async function adminFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = false, headers: extra = {}, ...rest } = options;
  const isFormData =
    typeof FormData !== "undefined" && rest.body != null && rest.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    token: clientId(),
    ...extra,
  };
  if (auth) {
    const authHeader = getAuthAuthorizationHeader();
    if (authHeader) headers.Authorization = authHeader;
  }

  const res = await fetch(`${apiBase()}${path}`, { ...rest, headers });
  const json = (await res.json().catch(() => ({}))) as ApiSuccess<T> | ApiErrorBody;

  if (!res.ok || (json as ApiErrorBody).code >= 400) {
    const msg =
      (json as ApiErrorBody).message ||
      res.statusText ||
      "Request failed";
    throw new Error(msg);
  }

  return json as T;
}

export type AdminLoginResponseData = {
  name: string;
  firstname: string;
  lastname: string;
  email: string;
  api_token: string;
  image_url: string | null;
};

export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  const body = {
    email,
    password,
    device_type: "web",
    device_token: getOrCreateDeviceToken(),
  };

  const json = await adminFetch<ApiSuccess<AdminLoginResponseData>>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const session: AdminSession = {
    api_token: json.data.api_token,
    email: json.data.email,
    firstname: json.data.firstname,
    lastname: json.data.lastname,
    name: json.data.name,
    image_url: json.data.image_url,
  };
  setAdminSession(session);
  return session;
}

export async function adminForgotPassword(email: string): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>("/api/admin/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function adminLogout(): Promise<void> {
  try {
    await adminFetch<ApiSuccess<unknown>>("/api/admin/logout", {
      method: "POST",
      body: JSON.stringify({}),
      auth: true,
    });
  } finally {
    clearAdminSession();
  }
}
