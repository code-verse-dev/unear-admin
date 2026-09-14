import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminActivityNotificationsQuery } from "@/hooks/useAdminActivityNotifications";
import { ACTIVITY_BELL_LIMIT } from "@/api/adminActivityNotifications";

const SEEN_KEY = "unear_admin_seen_activity_ids";

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-300)));
  } catch {
    /* ignore quota */
  }
}

/** Toasts when a new account appears after the first snapshot of this browser session. */
export function AdminNewAccountNotifier() {
  const navigate = useNavigate();
  const { data } = useAdminActivityNotificationsQuery(ACTIVITY_BELL_LIMIT);
  const primed = useRef(false);

  useEffect(() => {
    const items = data?.items;
    if (!items?.length && data == null) return;

    const seen = loadSeen();
    const ids = (items ?? []).map((n) => n.id);

    if (!primed.current) {
      primed.current = true;
      if (seen.size === 0) {
        ids.forEach((id) => seen.add(id));
        saveSeen(seen);
        return;
      }
    }

    const fresh = (items ?? []).filter((n) => n.kind === "user_registered" && !seen.has(n.id));
    ids.forEach((id) => seen.add(id));
    saveSeen(seen);

    if (fresh.length === 0) return;

    if (fresh.length === 1) {
      const n = fresh[0];
      toast(n.title, {
        description: n.message,
        duration: 8000,
        action: {
          label: "Review",
          onClick: () => navigate(n.path),
        },
      });
      return;
    }

    toast(`${fresh.length} new accounts`, {
      description: "Open Users to review pending profiles.",
      duration: 8000,
      action: {
        label: "Open",
        onClick: () => navigate("/users?verification=pending"),
      },
    });
  }, [data, navigate]);

  return null;
}
