import { format, parse } from "date-fns";

/** Last `count` calendar months ending this month, as `YYYY-MM`. */
export function getRollingMonthKeys(count: number): string[] {
  const out: string[] = [];
  const anchor = new Date();
  anchor.setDate(1);
  for (let i = count - 1; i >= 0; i--) {
    const x = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
}

export function formatMonthLabel(ym: string): string {
  try {
    const d = parse(`${ym}-01`, "yyyy-MM-dd", new Date());
    return format(d, "MMM yy");
  } catch {
    return ym;
  }
}

export type MonthlyRow = {
  month: string;
  total?: number | string;
  total_purchases?: number | string;
};

function rowValue(row: MonthlyRow, field: "total" | "total_purchases"): number {
  const raw = field === "total" ? row.total : row.total_purchases;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  return Number.isFinite(n) ? n! : 0;
}

export function seriesForMonths(
  months: string[],
  rows: MonthlyRow[],
  field: "total" | "total_purchases"
): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.month) map.set(r.month, rowValue(r, field));
  }
  return months.map((m) => ({
    label: formatMonthLabel(m),
    value: map.get(m) ?? 0,
  }));
}
