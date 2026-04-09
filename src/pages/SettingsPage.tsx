import { useEffect, useMemo, useState, type ReactNode } from "react";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { AdminSetting, FeeUnit } from "@/api/adminSettings";
import { useAdminSettingQuery, usePatchAdminSettingMutation } from "@/hooks/useAdminSettings";
import { cn } from "@/lib/utils";

type FormState = {
  tax: string;
  tax_unit: FeeUnit;
  platform_fee: string;
  platform_fee_unit: FeeUnit;
  platform_commission: string;
  platform_commission_unit: FeeUnit;
  insurance_commission: string;
  insurance_commission_unit: FeeUnit;
  insurance_addon_amount: string;
  insurance_addon_unit: FeeUnit;
  security_deposit_amount: string;
  security_deposit_unit: FeeUnit;
  inspection_charges: string;
  inspection_charges_unit: FeeUnit;
  marketplace_fee_percent: string;
  marketplace_fee_unit: FeeUnit;
  administration_fee_percent: string;
  administration_fee_unit: FeeUnit;
  platform_fee_percent: string;
  platform_fee_percent_unit: FeeUnit;
};

const emptyForm = (): FormState => ({
  tax: "",
  tax_unit: "percent",
  platform_fee: "",
  platform_fee_unit: "fixed",
  platform_commission: "",
  platform_commission_unit: "percent",
  insurance_commission: "",
  insurance_commission_unit: "percent",
  insurance_addon_amount: "",
  insurance_addon_unit: "fixed",
  security_deposit_amount: "",
  security_deposit_unit: "fixed",
  inspection_charges: "",
  inspection_charges_unit: "fixed",
  marketplace_fee_percent: "",
  marketplace_fee_unit: "percent",
  administration_fee_percent: "",
  administration_fee_unit: "percent",
  platform_fee_percent: "",
  platform_fee_percent_unit: "percent",
});

function displayNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "";
  return String(n);
}

function asFeeUnit(v: string | undefined, fallback: FeeUnit): FeeUnit {
  return v === "fixed" || v === "percent" ? v : fallback;
}

function settingToForm(s: AdminSetting): FormState {
  return {
    tax: displayNum(s.tax),
    tax_unit: asFeeUnit(s.tax_unit as string, "percent"),
    platform_fee: displayNum(s.platform_fee),
    platform_fee_unit: asFeeUnit(s.platform_fee_unit as string, "fixed"),
    platform_commission: displayNum(s.platform_commission),
    platform_commission_unit: asFeeUnit(s.platform_commission_unit as string, "percent"),
    insurance_commission: displayNum(s.insurance_commission),
    insurance_commission_unit: asFeeUnit(s.insurance_commission_unit as string, "percent"),
    insurance_addon_amount: displayNum(s.insurance_addon_amount ?? 0),
    insurance_addon_unit: asFeeUnit(s.insurance_addon_unit as string, "fixed"),
    security_deposit_amount: displayNum(s.security_deposit_amount),
    security_deposit_unit: asFeeUnit(s.security_deposit_unit as string, "fixed"),
    inspection_charges: displayNum(s.inspection_charges),
    inspection_charges_unit: asFeeUnit(s.inspection_charges_unit as string, "fixed"),
    marketplace_fee_percent: displayNum(s.marketplace_fee_percent),
    marketplace_fee_unit: asFeeUnit(s.marketplace_fee_unit as string, "percent"),
    administration_fee_percent: displayNum(s.administration_fee_percent),
    administration_fee_unit: asFeeUnit(s.administration_fee_unit as string, "percent"),
    platform_fee_percent: displayNum(s.platform_fee_percent),
    platform_fee_percent_unit: asFeeUnit(s.platform_fee_percent_unit as string, "percent"),
  };
}

function pctOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function num(s: string, fallback = 0): number {
  const n = parseFloat(String(s).trim());
  return Number.isFinite(n) ? n : fallback;
}

function buildPayload(form: FormState, persisted: AdminSetting) {
  return {
    title: (persisted.title ?? "").trim() || "UNear",
    tax: num(form.tax),
    tax_unit: form.tax_unit,
    platform_fee: num(form.platform_fee),
    platform_fee_unit: form.platform_fee_unit,
    platform_commission: num(form.platform_commission),
    platform_commission_unit: form.platform_commission_unit,
    insurance_commission: num(form.insurance_commission),
    insurance_commission_unit: form.insurance_commission_unit,
    insurance_addon_amount: num(form.insurance_addon_amount),
    insurance_addon_unit: form.insurance_addon_unit,
    security_deposit_amount: num(form.security_deposit_amount),
    security_deposit_unit: form.security_deposit_unit,
    inspection_charges: num(form.inspection_charges),
    inspection_charges_unit: form.inspection_charges_unit,
    app_store_url: persisted.app_store_url,
    play_store_url: persisted.play_store_url,
    marketplace_fee_percent: pctOrNull(form.marketplace_fee_percent),
    marketplace_fee_unit: form.marketplace_fee_unit,
    administration_fee_percent: pctOrNull(form.administration_fee_percent),
    administration_fee_unit: form.administration_fee_unit,
    platform_fee_percent: pctOrNull(form.platform_fee_percent),
    platform_fee_percent_unit: form.platform_fee_percent_unit,
  };
}

function FeeField({
  label,
  value,
  unit,
  onValue,
  onUnit,
  disabled,
}: {
  label: string;
  value: string;
  unit: FeeUnit;
  onValue: (v: string) => void;
  onUnit: (u: FeeUnit) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <Label className="text-sm font-medium text-foreground sm:w-44 sm:shrink-0">{label}</Label>
      <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:min-w-0">
        <Input
          type="number"
          step="0.01"
          min={0}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          disabled={disabled}
          placeholder="0"
          className="h-10 w-[min(100%,140px)] bg-background"
        />
        <Select value={unit} onValueChange={(v) => onUnit(v as FeeUnit)} disabled={disabled}>
          <SelectTrigger className="h-10 w-[108px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">%</SelectItem>
            <SelectItem value="fixed">$</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SettingsFieldRowSkeleton() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <Skeleton className="h-4 w-36 sm:w-44 shrink-0" />
      <div className="flex flex-wrap items-center gap-2 sm:flex-1">
        <Skeleton className="h-10 w-[min(100%,140px)]" />
        <Skeleton className="h-10 w-[108px]" />
      </div>
    </div>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <section className="admin-card space-y-5 border-border/80 bg-gradient-to-br from-card via-card to-muted/10 dark:to-muted/5">
        <Skeleton className="h-5 w-64 max-w-full" />
        <div className="space-y-4">
          <SettingsFieldRowSkeleton />
          <SettingsFieldRowSkeleton />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </section>

      <section className="admin-card space-y-5 border-border/80 bg-gradient-to-br from-card via-card to-muted/10 dark:to-muted/5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="space-y-4">
          <SettingsFieldRowSkeleton />
          <SettingsFieldRowSkeleton />
        </div>
      </section>

      <section className="admin-card space-y-5 border-border/80 bg-gradient-to-br from-card via-card to-muted/10 dark:to-muted/5">
        <Skeleton className="h-5 w-40 max-w-full" />
        <div className="space-y-4">
          <SettingsFieldRowSkeleton />
          <SettingsFieldRowSkeleton />
          <SettingsFieldRowSkeleton />
        </div>
      </section>

      <Skeleton className="h-10 w-[140px] rounded-md" />
    </div>
  );
}

function SettingsCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="admin-card space-y-5 border-border/80 bg-gradient-to-br from-card via-card to-muted/10 dark:to-muted/5">
      <div>
        <h2 className="font-['DM_Sans',system-ui,sans-serif] text-base font-semibold tracking-tight text-card-foreground">
          {title}
        </h2>
        {hint ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const SettingsPage = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminSettingQuery();
  const patchMut = usePatchAdminSettingMutation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (data) setForm(settingToForm(data));
  }, [data]);

  const usesStructuredFees = useMemo(() => {
    const m = form.marketplace_fee_percent.trim();
    const a = form.administration_fee_percent.trim();
    const p = form.platform_fee_percent.trim();
    return m !== "" && a !== "" && p !== "";
  }, [form.marketplace_fee_percent, form.administration_fee_percent, form.platform_fee_percent]);

  useEffect(() => {
    if (usesStructuredFees) setAdvancedOpen(true);
  }, [usesStructuredFees]);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Could not load settings",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = () => {
    if (!data?.id) return;
    patchMut.mutate(
      { id: data.id, body: buildPayload(form, data) },
      {
        onSuccess: () => toast({ title: "Saved" }),
        onError: (e) =>
          toast({
            title: "Save failed",
            description: e instanceof Error ? e.message : "Try again.",
            variant: "destructive",
          }),
      }
    );
  };

  if (isLoading && !data) {
    return (
      <PageContainer fullWidth title="Settings">
        <SettingsPageSkeleton />
      </PageContainer>
    );
  }

  if (!isLoading && !data) {
    return (
      <PageContainer fullWidth title="Settings">
        <div className="admin-card flex flex-col items-start gap-4 py-10 text-muted-foreground">
          <p className="text-sm">Could not load settings.</p>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry"}
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!data) return null;

  return (
    <PageContainer fullWidth title="Settings">
      <div className="w-full min-w-0 space-y-6">
        <SettingsCard title="Booking & purchase platform">
          <FeeField
            label="Platform fee"
            value={form.platform_fee}
            unit={form.platform_fee_unit}
            onValue={(v) => update("platform_fee", v)}
            onUnit={(u) => update("platform_fee_unit", u)}
            disabled={usesStructuredFees}
          />
          <FeeField
            label="Commission"
            value={form.platform_commission}
            unit={form.platform_commission_unit}
            onValue={(v) => update("platform_commission", v)}
            onUnit={(u) => update("platform_commission_unit", u)}
            disabled={usesStructuredFees}
          />

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                <span>Advanced — 3-line split</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", advancedOpen && "rotate-180")}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <FeeField
                label="Marketplace"
                value={form.marketplace_fee_percent}
                unit={form.marketplace_fee_unit}
                onValue={(v) => update("marketplace_fee_percent", v)}
                onUnit={(u) => update("marketplace_fee_unit", u)}
              />
              <FeeField
                label="Administration"
                value={form.administration_fee_percent}
                unit={form.administration_fee_unit}
                onValue={(v) => update("administration_fee_percent", v)}
                onUnit={(u) => update("administration_fee_unit", u)}
              />
              <FeeField
                label="Platform on marketplace"
                value={form.platform_fee_percent}
                unit={form.platform_fee_percent_unit}
                onValue={(v) => update("platform_fee_percent", v)}
                onUnit={(u) => update("platform_fee_percent_unit", u)}
              />
            </CollapsibleContent>
          </Collapsible>
        </SettingsCard>

        <SettingsCard
          title="Insurance (trip add-on)"
          hint="The input is one amount; % or $ is how it’s applied (percent of the insurer quote vs flat dollars). Markup and add-on are two separate optional charges—set either to 0 if you don’t need it."
        >
          <FeeField
            label="Markup"
            value={form.insurance_commission}
            unit={form.insurance_commission_unit}
            onValue={(v) => update("insurance_commission", v)}
            onUnit={(u) => update("insurance_commission_unit", u)}
          />
          <FeeField
            label="Add-on"
            value={form.insurance_addon_amount}
            unit={form.insurance_addon_unit}
            onValue={(v) => update("insurance_addon_amount", v)}
            onUnit={(u) => update("insurance_addon_unit", u)}
          />
        </SettingsCard>

        <SettingsCard title="Tax & other">
          <FeeField
            label="Tax"
            value={form.tax}
            unit={form.tax_unit}
            onValue={(v) => update("tax", v)}
            onUnit={(u) => update("tax_unit", u)}
          />
          <FeeField
            label="Security deposit"
            value={form.security_deposit_amount}
            unit={form.security_deposit_unit}
            onValue={(v) => update("security_deposit_amount", v)}
            onUnit={(u) => update("security_deposit_unit", u)}
          />
          <FeeField
            label="Inspection"
            value={form.inspection_charges}
            unit={form.inspection_charges_unit}
            onValue={(v) => update("inspection_charges", v)}
            onUnit={(u) => update("inspection_charges_unit", u)}
          />
        </SettingsCard>

        <Button
          type="button"
          onClick={onSave}
          disabled={patchMut.isPending}
          className="inline-flex min-w-[140px] items-center gap-2"
        >
          {patchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
