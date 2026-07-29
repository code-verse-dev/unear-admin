import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

export type FeeUnit = "percent" | "fixed";

export type AdminSetting = {
  id: number;
  title: string;
  fee_label?: string | null;
  tax: number;
  platform_fee: number;
  platform_commission: number;
  insurance_commission: number;
  insurance_addon_amount?: number;
  security_deposit_amount: number;
  inspection_charges: number;
  app_store_url: string | null;
  play_store_url: string | null;
  marketplace_fee_percent: number | null;
  administration_fee_percent: number | null;
  platform_fee_percent: number | null;
  tax_unit?: FeeUnit | string;
  platform_fee_unit?: FeeUnit | string;
  platform_commission_unit?: FeeUnit | string;
  insurance_commission_unit?: FeeUnit | string;
  insurance_addon_unit?: FeeUnit | string;
  security_deposit_unit?: FeeUnit | string;
  inspection_charges_unit?: FeeUnit | string;
  marketplace_fee_unit?: FeeUnit | string;
  administration_fee_unit?: FeeUnit | string;
  platform_fee_percent_unit?: FeeUnit | string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSettingUpdate = Partial<
  Pick<
    AdminSetting,
    | "title"
    | "fee_label"
    | "tax"
    | "platform_fee"
    | "platform_commission"
    | "insurance_commission"
    | "insurance_addon_amount"
    | "security_deposit_amount"
    | "inspection_charges"
    | "app_store_url"
    | "play_store_url"
    | "marketplace_fee_percent"
    | "administration_fee_percent"
    | "platform_fee_percent"
    | "tax_unit"
    | "platform_fee_unit"
    | "platform_commission_unit"
    | "insurance_commission_unit"
    | "insurance_addon_unit"
    | "security_deposit_unit"
    | "inspection_charges_unit"
    | "marketplace_fee_unit"
    | "administration_fee_unit"
    | "platform_fee_percent_unit"
  >
>;

export async function getAdminSetting(): Promise<AdminSetting> {
  const json = await adminFetch<ApiSuccess<AdminSetting>>("/api/admin/setting", {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export async function patchAdminSetting(id: number, body: AdminSettingUpdate): Promise<AdminSetting> {
  const json = await adminFetch<ApiSuccess<AdminSetting>>(`/api/admin/setting/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
  return json.data;
}
