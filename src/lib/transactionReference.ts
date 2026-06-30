export const REFERENCE_PREFIX = "UN-TXN-";

/** Minimum serial width; grows automatically when id exceeds this many digits. */
export type ReferencePadDigits = "6" | "7" | "8" | "auto";

export const REFERENCE_PAD_OPTIONS: { label: string; value: ReferencePadDigits }[] = [
  { label: "8-digit serial", value: "8" },
  { label: "7-digit serial", value: "7" },
  { label: "6-digit serial", value: "6" },
  { label: "Auto (grows past 8)", value: "auto" },
];

function minPadWidth(pad: ReferencePadDigits): number {
  if (pad === "auto") return 8;
  return parseInt(pad, 10);
}

/** Format reference for display; serial expands beyond 6/7/8 digits when needed. */
export function formatTransactionReference(id: number, pad: ReferencePadDigits = "8"): string {
  const n = Math.floor(Number(id));
  if (!Number.isFinite(n) || n <= 0) return "";
  const serial = String(n);
  const width = Math.max(minPadWidth(pad), serial.length);
  return `${REFERENCE_PREFIX}${serial.padStart(width, "0")}`;
}

export function transactionReferenceNumber(
  t: { id: number; reference_number?: string | null },
  pad: ReferencePadDigits = "8"
): string {
  if (t.reference_number?.trim()) {
    const stored = t.reference_number.trim();
    if (pad === "auto") return stored;
    const m = stored.match(/^UN-TXN-?(0*\d+)$/i);
    if (m) {
      const num = parseInt(m[1].replace(/^0+/, "") || "0", 10);
      if (Number.isFinite(num) && num > 0) return formatTransactionReference(num, pad);
    }
    return stored;
  }
  return formatTransactionReference(t.id, pad);
}

/** Strip UN-TXN- prefix and leading zeros for search (e.g. 00042 → 42). */
export function parseReferenceSearchSerial(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const prefixed = s.match(/^UN-TXN-?(0*\d+)$/i);
  const digits = prefixed ? prefixed[1] : /^0*\d+$/.test(s) ? s : null;
  if (digits == null) return null;
  const n = parseInt(String(digits).replace(/^0+/, "") || "0", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
