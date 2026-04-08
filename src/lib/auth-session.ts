const SESSION_KEY = "unear_admin_session";
const DEVICE_TOKEN_KEY = "unear_admin_device_token";

export type AdminSession = {
  api_token: string;
  email: string;
  firstname: string;
  lastname: string;
  name: string;
  image_url: string | null;
};

export function getOrCreateDeviceToken(): string {
  try {
    let t = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (!t) {
      t = `web-${crypto.randomUUID()}`;
      localStorage.setItem(DEVICE_TOKEN_KEY, t);
    }
    return t;
  } catch {
    return `web-${Date.now()}`;
  }
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.api_token || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
