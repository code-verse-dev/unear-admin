import { adminFetch, type ApiSuccess } from "@/lib/admin-api";
import type { PaginationLinks } from "@/api/users";

export const TRANSACTIONS_PAGE_SIZE_DEFAULT = 10;

export type TransactionUser = {
  id: number;
  firstname?: string;
  lastname?: string;
  image_url?: string | null;
};

export type AdminTransaction = {
  id: number;
  user_id: number;
  user_type: string;
  instance_type: number;
  instance_id: number;
  reference_number: string;
  transaction_type: number;
  transaction_amount: number;
  status: string;
  description: string | null;
  user: TransactionUser | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

/** Backend `Transaction` resource wraps list rows in `{ total_amount, data }`. */
export type TransactionIndexPayload = {
  total_amount?: number;
  data: AdminTransaction[];
};

import type { ReferencePadDigits } from "@/lib/transactionReference";

export type TransactionsListParams = {
  page: number;
  limit?: number;
  user_id?: number;
  user_type?: string;
  instance_type?: number;
  transaction_id?: number;
  /** Admin: matches reference number (with/without leading zeros), id, description, user name */
  search?: string;
  /** Admin: 6 | 7 | 8 | auto — reference serial padding when searching numeric refs */
  reference_pad?: ReferencePadDigits;
  /** Admin: case-insensitive status match (e.g. succeeded, pending) */
  status?: string;
  orderBy?: string;
  order?: "ASC" | "DESC";
};

function buildTransactionsQuery(params: TransactionsListParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? TRANSACTIONS_PAGE_SIZE_DEFAULT));
  sp.set("orderBy", params.orderBy ?? "id");
  sp.set("order", params.order ?? "DESC");
  if (params.user_id != null) sp.set("user_id", String(params.user_id));
  if (params.user_type?.trim()) sp.set("user_type", params.user_type.trim());
  if (params.instance_type != null) sp.set("instance_type", String(params.instance_type));
  if (params.transaction_id != null) sp.set("transaction_id", String(params.transaction_id));
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.reference_pad?.trim()) sp.set("reference_pad", params.reference_pad.trim());
  if (params.status?.trim()) sp.set("status", params.status.trim());
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type TransactionsListResult = {
  rows: AdminTransaction[];
  totalAmount: number;
  links: PaginationLinks | null;
};

export async function listTransactions(
  params: TransactionsListParams
): Promise<TransactionsListResult> {
  const json = await adminFetch<ApiSuccess<TransactionIndexPayload | AdminTransaction[]> & { links?: PaginationLinks }>(
    `/api/admin/transaction${buildTransactionsQuery(params)}`,
    { method: "GET", auth: true }
  );

  const raw = json.data;
  let rows: AdminTransaction[] = [];
  let totalAmount = 0;

  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray((raw as TransactionIndexPayload).data)) {
    const p = raw as TransactionIndexPayload;
    rows = p.data;
    totalAmount = typeof p.total_amount === "number" ? p.total_amount : 0;
  } else if (Array.isArray(raw)) {
    rows = raw;
  }

  return {
    rows,
    totalAmount,
    links: json.links ?? null,
  };
}

function unwrapTransactionPayload(raw: unknown): AdminTransaction | null {
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = (raw as TransactionIndexPayload).data;
    if (inner && typeof inner === "object" && !Array.isArray(inner) && "id" in inner) {
      return inner as AdminTransaction;
    }
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "id" in raw) {
    return raw as AdminTransaction;
  }
  return null;
}

export async function getTransaction(id: number): Promise<AdminTransaction> {
  const json = await adminFetch<ApiSuccess<TransactionIndexPayload | AdminTransaction>>(
    `/api/admin/transaction/${id}`,
    { method: "GET", auth: true }
  );
  const row = unwrapTransactionPayload(json.data);
  if (!row) {
    throw new Error("Invalid transaction response");
  }
  return row;
}

export const transactionsQueryKeyRoot = ["admin", "transactions"] as const;

export function transactionsListQueryKey(params: TransactionsListParams) {
  return [...transactionsQueryKeyRoot, "list", params] as const;
}

export function transactionDetailQueryKey(id: number) {
  return [...transactionsQueryKeyRoot, "detail", id] as const;
}
