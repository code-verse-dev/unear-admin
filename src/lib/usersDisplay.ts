import type { AppUser } from "@/api/users";

export function formatDateUS(iso: string | undefined | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

export function displayName(u: AppUser) {
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.display_name || u.name || u.nickname || u.email || `User #${u.id}`;
}

export function userInitials(u: AppUser): string {
  const base =
    [u.firstname, u.lastname].filter(Boolean).join(" ").trim() ||
    u.display_name ||
    u.name ||
    u.nickname ||
    u.email ||
    "?";
  const parts = base.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase() || "?";
  }
  return base.slice(0, 2).toUpperCase() || "?";
}

export function accountLabel(u: AppUser): { label: string; variant: "success" | "destructive" | "warning" } {
  if (u.is_blocked) return { label: "Blocked", variant: "destructive" };
  if (!u.is_activated) return { label: "Deactivated", variant: "warning" };
  return { label: "Active", variant: "success" };
}

export function textOrDash(value: string | number | null | undefined) {
  if (value == null) return "—";
  const s = String(value).trim();
  return s || "—";
}
