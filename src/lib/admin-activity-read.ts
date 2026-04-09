const STORAGE_KEY = "unear_admin_activity_read_ids";

function parseStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getReadActivityIds(): Set<string> {
  return new Set(parseStored());
}

export function markActivityIdsRead(ids: string[]): void {
  if (ids.length === 0) return;
  const next = new Set(parseStored());
  ids.forEach((id) => next.add(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
}
