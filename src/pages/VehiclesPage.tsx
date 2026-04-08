import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Eye, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  VEHICLES_PAGE_SIZE_DEFAULT,
  VEHICLE_STATUS,
  getVehicle,
  vehicleDetailQueryKey,
  vehicleListingImageUrls,
  vehiclesQueryKeyRoot,
  type AdminVehicle,
  type UpdateVehicleBody,
  type VehiclesListParams,
} from "@/api/vehicles";
import { useVehiclesListQuery, useUpdateVehicleMutation } from "@/hooks/useAdminVehicles";
import { resolveMediaUrl } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

function displayOwner(v: AdminVehicle): string {
  const o = v.owner;
  if (!o) return `User #${v.user_id}`;
  const n = [o.firstname, o.lastname].filter(Boolean).join(" ").trim();
  return n || `User #${o.id}`;
}

function ownerInitials(v: AdminVehicle): string {
  const o = v.owner;
  if (!o) return "?";
  const a = (o.firstname?.[0] || "").toUpperCase();
  const b = (o.lastname?.[0] || "").toUpperCase();
  if (a && b) return `${a}${b}`;
  return (a || b || "?").slice(0, 2);
}

function statusLabel(status: number): string {
  switch (status) {
    case VEHICLE_STATUS.AVAILABLE:
      return "Available";
    case VEHICLE_STATUS.RESERVED:
      return "Reserved";
    case VEHICLE_STATUS.TOKEN_PAID:
      return "Token paid";
    case VEHICLE_STATUS.SOLD:
      return "Sold";
    case VEHICLE_STATUS.RENTED:
      return "Rented";
    default:
      return `Status ${status}`;
  }
}

function statusVariant(
  status: number
): "success" | "warning" | "destructive" | "default" | "secondary" {
  if (status === VEHICLE_STATUS.AVAILABLE) return "success";
  if (status === VEHICLE_STATUS.RESERVED || status === VEHICLE_STATUS.TOKEN_PAID) return "warning";
  if (status === VEHICLE_STATUS.SOLD || status === VEHICLE_STATUS.RENTED) return "secondary";
  return "default";
}

function listingTypeLabel(type: number): string {
  if (type === 10) return "Sale";
  if (type === 20) return "Rent";
  return `Type ${type}`;
}

function truncateVin(vin: string, max = 12) {
  if (!vin || vin.length <= max) return vin || "—";
  return `${vin.slice(0, max)}…`;
}

type VehicleEditForm = {
  type: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  older_vehicle: string;
  fuel_type: string;
  transmission: string;
  engine_cc: string;
  fuel_tank_capacity: string;
  color: string;
  seats: string;
  mileage: string;
  horsepower: string;
  car_type: string;
  eco_friendly: string;
  car_class: string;
  price: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  branded_or_salvage_title: string;
  tax_paid: string;
  license_plate_number: string;
  license_plate_state: string;
  description: string;
  instructions: string;
  status: string;
  blocked_by_admin: string;
};

function boolishToSelect(n: unknown): string {
  return n === true || n === 1 || n === "1" ? "1" : "0";
}

function vehicleToForm(v: AdminVehicle): VehicleEditForm {
  const r = v as Record<string, unknown>;
  return {
    type: String(v.type ?? ""),
    make: String(v.make ?? ""),
    model: String(v.model ?? ""),
    year: String(v.year ?? ""),
    vin: String(v.vin ?? ""),
    older_vehicle: boolishToSelect(r.older_vehicle),
    fuel_type: String(v.fuel_type ?? ""),
    transmission: String(v.transmission ?? ""),
    engine_cc: String(r.engine_cc ?? ""),
    fuel_tank_capacity: String(r.fuel_tank_capacity ?? ""),
    color: String(v.color ?? ""),
    seats: String(v.seats ?? ""),
    mileage: String(v.mileage ?? ""),
    horsepower: String(v.horsepower ?? ""),
    car_type: String(v.car_type ?? ""),
    eco_friendly: String(v.eco_friendly ?? ""),
    car_class: String(v.car_class ?? ""),
    price: String(v.price ?? ""),
    address: String(v.address ?? ""),
    country: String(v.country ?? ""),
    city: String(v.city ?? ""),
    state: String(v.state ?? ""),
    zipcode: String(v.zipcode ?? ""),
    latitude: String(r.latitude ?? ""),
    longitude: String(r.longitude ?? ""),
    branded_or_salvage_title: boolishToSelect(r.branded_or_salvage_title),
    tax_paid: boolishToSelect(r.tax_paid),
    license_plate_number: String(v.license_plate_number ?? ""),
    license_plate_state: String(v.license_plate_state ?? ""),
    description: String(v.description ?? ""),
    instructions: String(v.instructions ?? ""),
    status: String(v.status ?? ""),
    blocked_by_admin: boolishToSelect(v.blocked_by_admin),
  };
}

function buildUpdateBody(f: VehicleEditForm): UpdateVehicleBody {
  const bit = (s: string) => (s === "1" || s === "true" ? 1 : 0);
  return {
    type: parseInt(f.type, 10),
    make: f.make.trim(),
    model: f.model.trim(),
    year: f.year.trim(),
    vin: f.vin.trim(),
    older_vehicle: bit(f.older_vehicle),
    fuel_type: f.fuel_type.trim(),
    transmission: f.transmission.trim(),
    engine_cc: parseInt(f.engine_cc, 10) || 0,
    fuel_tank_capacity: parseFloat(f.fuel_tank_capacity) || 0,
    color: f.color.trim() || null,
    seats: parseInt(f.seats, 10) || 0,
    mileage: f.mileage.trim(),
    horsepower: f.horsepower.trim(),
    car_type: f.car_type.trim(),
    eco_friendly: f.eco_friendly.trim(),
    car_class: f.car_class.trim(),
    price: parseFloat(f.price) || 0,
    address: f.address.trim(),
    country: f.country.trim() || null,
    city: f.city.trim(),
    state: f.state.trim(),
    zipcode: f.zipcode.trim(),
    latitude: f.latitude.trim(),
    longitude: f.longitude.trim(),
    branded_or_salvage_title: bit(f.branded_or_salvage_title),
    tax_paid: bit(f.tax_paid),
    license_plate_number: f.license_plate_number.trim(),
    license_plate_state: f.license_plate_state.trim(),
    description: f.description.trim() || null,
    instructions: f.instructions.trim() || null,
    status: parseInt(f.status, 10),
    blocked_by_admin: bit(f.blocked_by_admin),
  };
}

function emptyVehicleEditForm(): VehicleEditForm {
  const z = "";
  return {
    type: "10",
    make: z,
    model: z,
    year: z,
    vin: z,
    older_vehicle: "0",
    fuel_type: z,
    transmission: z,
    engine_cc: z,
    fuel_tank_capacity: z,
    color: z,
    seats: z,
    mileage: z,
    horsepower: z,
    car_type: z,
    eco_friendly: z,
    car_class: z,
    price: z,
    address: z,
    country: z,
    city: z,
    state: z,
    zipcode: z,
    latitude: z,
    longitude: z,
    branded_or_salvage_title: "0",
    tax_paid: "0",
    license_plate_number: z,
    license_plate_state: z,
    description: z,
    instructions: z,
    status: String(VEHICLE_STATUS.AVAILABLE),
    blocked_by_admin: "0",
  };
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

type VehicleSheetMode = "view" | "edit";

const VehiclesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [restrictedFilter, setRestrictedFilter] = useState<string>("all");
  const [vehicleSheetMode, setVehicleSheetMode] = useState<VehicleSheetMode | null>(null);
  const [selected, setSelected] = useState<AdminVehicle | null>(null);
  const [vehicleEditForm, setVehicleEditForm] = useState<VehicleEditForm>(emptyVehicleEditForm);
  const queryClient = useQueryClient();

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, restrictedFilter]);

  const listParams: VehiclesListParams = useMemo(
    () => ({
      page,
      limit: VEHICLES_PAGE_SIZE_DEFAULT,
      search: debouncedSearch || undefined,
      status:
        statusFilter === "all"
          ? "all"
          : (statusFilter as VehiclesListParams["status"]),
      restricted:
        restrictedFilter === "all"
          ? "all"
          : (restrictedFilter as VehiclesListParams["restricted"]),
    }),
    [page, debouncedSearch, statusFilter, restrictedFilter]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useVehiclesListQuery(listParams);
  const updateMut = useUpdateVehicleMutation();
  const busy = updateMut.isPending;

  const editVehicleId = vehicleSheetMode === "edit" && selected ? selected.id : null;
  const { data: editVehicleData, isFetching: editVehicleFetching } = useQuery({
    queryKey: editVehicleId != null ? vehicleDetailQueryKey(editVehicleId) : ["admin", "vehicles", "detail", "none"],
    queryFn: () => getVehicle(editVehicleId!),
    enabled: editVehicleId != null,
    placeholderData: selected && selected.id === editVehicleId ? selected : undefined,
  });

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load vehicles", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (vehicleSheetMode !== "edit" || !editVehicleData) return;
    setVehicleEditForm(vehicleToForm(editVehicleData));
  }, [vehicleSheetMode, editVehicleData]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openViewSheet = (v: AdminVehicle) => {
    setSelected(v);
    setVehicleSheetMode("view");
  };

  const openEditSheet = (v: AdminVehicle) => {
    setSelected(v);
    setVehicleSheetMode("edit");
  };

  const toggleRestricted = async (v: AdminVehicle) => {
    const next = v.blocked_by_admin ? 0 : 1;
    try {
      const updated = await updateMut.mutateAsync({
        id: v.id,
        body: { blocked_by_admin: next },
      });
      if (selected?.id === v.id) setSelected(updated);
      toast({
        title: next ? "Vehicle restricted" : "Restriction removed",
        description: `${v.make} ${v.model} (${v.year})`,
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSaveVehicle = async () => {
    if (!selected) return;
    try {
      const body = buildUpdateBody(vehicleEditForm);
      if (Number.isNaN(body.type as number) || Number.isNaN(body.status as number)) {
        toast({
          title: "Invalid values",
          description: "Listing type and workflow status must be valid numbers.",
          variant: "destructive",
        });
        return;
      }
      const updated = await updateMut.mutateAsync({ id: selected.id, body });
      setSelected(updated);
      await queryClient.invalidateQueries({ queryKey: vehiclesQueryKeyRoot });
      await queryClient.invalidateQueries({ queryKey: vehicleDetailQueryKey(selected.id) });
      toast({
        title: "Vehicle updated",
        description: `${updated.make} ${updated.model} (${updated.year})`,
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminVehicle>[] = [
    { key: "id", header: "ID", render: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "photos",
      header: "Photos",
      className: "w-[88px]",
      render: (row) => {
        const urls = vehicleListingImageUrls(row);
        if (!urls.length) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        const extra = urls.length - 1;
        return (
          <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <img src={urls[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
            {extra > 0 ? (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-background/95 px-1 py-px text-[10px] font-semibold tabular-nums text-foreground shadow-sm">
                +{extra}
              </span>
            ) : null}
          </div>
        );
      },
    },
    { key: "make", header: "Make", render: (row) => <span>{row.make || "—"}</span> },
    { key: "model", header: "Model", render: (row) => <span>{row.model || "—"}</span> },
    { key: "year", header: "Year", render: (row) => <span>{row.year ?? "—"}</span> },
    {
      key: "vin",
      header: "VIN",
      render: (row) => <span className="font-mono text-xs">{truncateVin(row.vin || "")}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={statusVariant(row.status)}>{statusLabel(row.status)}</StatusBadge>
      ),
    },
    {
      key: "restricted",
      header: "Restricted",
      render: (row) => {
        const isBlocked = Boolean(row.blocked_by_admin);
        const pending = updateMut.isPending && updateMut.variables?.id === row.id;
        return (
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-8 py-0.5 px-1.5 -ml-1.5 gap-1.5 hover:bg-muted/80"
            title={isBlocked ? "Remove admin restriction" : "Restrict listing"}
            disabled={busy}
            onClick={() => void toggleRestricted(row)}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : null}
            <StatusBadge variant={isBlocked ? "destructive" : "success"}>
              {isBlocked ? "Yes" : "No"}
            </StatusBadge>
          </Button>
        );
      },
    },
    {
      key: "createdAt",
      header: "Listed",
      render: (row) => <span>{formatDateUS(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            title="View"
            disabled={busy}
            onClick={() => openViewSheet(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            title="Edit"
            disabled={busy}
            onClick={() => openEditSheet(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Vehicles" subtitle="Manage platform listings" fullWidth>
      <div className="mb-4 flex flex-col gap-2">
        <SearchFilter
          searchPlaceholder="Search make, model, VIN, plate, or description..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching && !isLoading}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All statuses", value: "all" },
                { label: "Available", value: "available" },
                { label: "Reserved", value: "reserved" },
                { label: "Token paid", value: "token_paid" },
                { label: "Sold", value: "sold" },
                { label: "Rented", value: "rented" },
              ],
            },
            {
              label: "Restricted",
              value: restrictedFilter,
              onChange: setRestrictedFilter,
              options: [
                { label: "All", value: "all" },
                { label: "Restricted", value: "yes" },
                { label: "Not restricted", value: "no" },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setStatusFilter("all");
            setRestrictedFilter("all");
            setPage(1);
          }}
        />
        {isError ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      <div className="relative w-full min-w-0 rounded-xl border border-border bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          getRowId={(v) => v.id}
          emptyMessage="No vehicles match your filters."
          isLoading={isLoading}
          pageSize={listParams.limit ?? VEHICLES_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          skeletonRowCount={listParams.limit ?? VEHICLES_PAGE_SIZE_DEFAULT}
        />
      </div>

      <Sheet
        open={vehicleSheetMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setVehicleSheetMode(null);
            setSelected(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full flex-col gap-0 overflow-hidden p-0",
            vehicleSheetMode === "view" && "sm:max-w-xl",
            vehicleSheetMode === "edit" && "sm:max-w-2xl"
          )}
        >
          <SheetDescription className="sr-only">
            {vehicleSheetMode === "view"
              ? "Vehicle listing details"
              : vehicleSheetMode === "edit"
                ? "Edit vehicle listing"
                : ""}
          </SheetDescription>
          {selected && vehicleSheetMode === "view" ? (
            <>
              <SheetTitle className="sr-only">
                {selected.make} {selected.model} {selected.year}
              </SheetTitle>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Vehicle details</h2>
                  <p className="text-sm text-muted-foreground">
                    {[selected.make, selected.model].filter(Boolean).join(" ")}
                    {selected.year != null ? ` (${selected.year})` : ""}
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  {vehicleListingImageUrls(selected).length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Listing images</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {vehicleListingImageUrls(selected).map((src, i) => (
                          <a
                            key={`${src}-${i}`}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted outline-none ring-offset-background transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <Avatar className="h-14 w-14 shrink-0 border-2 border-border shadow-sm">
                      <AvatarImage
                        src={resolveMediaUrl(selected.owner?.image_url)}
                        alt=""
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-semibold">{ownerInitials(selected)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="truncate font-medium text-foreground">{displayOwner(selected)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono font-medium">{selected.id}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="break-all text-right font-mono font-medium">{selected.vin || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Listing type</span>
                    <span className="font-medium">{listingTypeLabel(selected.type)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge variant={statusVariant(selected.status)}>{statusLabel(selected.status)}</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Restricted</span>
                    <StatusBadge variant={selected.blocked_by_admin ? "destructive" : "success"}>
                      {selected.blocked_by_admin ? "Yes" : "No"}
                    </StatusBadge>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-right font-medium">
                      {[selected.city, selected.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">
                      {selected.price != null ? `$${Number(selected.price).toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Plate</span>
                    <span className="font-medium">
                      {selected.license_plate_number
                        ? `${selected.license_plate_number}${selected.license_plate_state ? ` (${selected.license_plate_state})` : ""}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Listed</span>
                    <span className="font-medium">{formatDateUS(selected.createdAt)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {selected && vehicleSheetMode === "edit" ? (
            <>
              <SheetTitle className="sr-only">
                Edit {selected.make} {selected.model}
              </SheetTitle>
              <div className="flex min-h-0 flex-1 flex-col bg-muted/25">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 pt-14 sm:pt-6">
                  <div className="flex items-start justify-between gap-2 pr-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Edit vehicle</h3>
                      <p className="text-xs text-muted-foreground">
                        #{selected.id} · {displayOwner(selected)}
                      </p>
                    </div>
                    {editVehicleFetching ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                    ) : null}
                  </div>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Admin & listing
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Admin restriction</Label>
                        <Select
                          value={vehicleEditForm.blocked_by_admin}
                          onValueChange={(v) =>
                            setVehicleEditForm((p) => ({ ...p, blocked_by_admin: v }))
                          }
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Not restricted</SelectItem>
                            <SelectItem value="1">Restricted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Workflow status</Label>
                        <Select
                          value={vehicleEditForm.status}
                          onValueChange={(v) => setVehicleEditForm((p) => ({ ...p, status: v }))}
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={String(VEHICLE_STATUS.AVAILABLE)}>
                              {statusLabel(VEHICLE_STATUS.AVAILABLE)}
                            </SelectItem>
                            <SelectItem value={String(VEHICLE_STATUS.RESERVED)}>
                              {statusLabel(VEHICLE_STATUS.RESERVED)}
                            </SelectItem>
                            <SelectItem value={String(VEHICLE_STATUS.TOKEN_PAID)}>
                              {statusLabel(VEHICLE_STATUS.TOKEN_PAID)}
                            </SelectItem>
                            <SelectItem value={String(VEHICLE_STATUS.SOLD)}>
                              {statusLabel(VEHICLE_STATUS.SOLD)}
                            </SelectItem>
                            <SelectItem value={String(VEHICLE_STATUS.RENTED)}>
                              {statusLabel(VEHICLE_STATUS.RENTED)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Listing type</Label>
                        <Select
                          value={vehicleEditForm.type}
                          onValueChange={(v) => setVehicleEditForm((p) => ({ ...p, type: v }))}
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">Sale</SelectItem>
                            <SelectItem value="20">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Price</Label>
                        <Input
                          inputMode="decimal"
                          value={vehicleEditForm.price}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, price: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Identity
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>VIN</Label>
                        <Input
                          value={vehicleEditForm.vin}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, vin: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Make</Label>
                        <Input
                          value={vehicleEditForm.make}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, make: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Model</Label>
                        <Input
                          value={vehicleEditForm.model}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, model: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Year</Label>
                        <Input
                          value={vehicleEditForm.year}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, year: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Older vehicle (manual specs)</Label>
                        <Select
                          value={vehicleEditForm.older_vehicle}
                          onValueChange={(v) =>
                            setVehicleEditForm((p) => ({ ...p, older_vehicle: v }))
                          }
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No</SelectItem>
                            <SelectItem value="1">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Specs
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Fuel type</Label>
                        <Input
                          value={vehicleEditForm.fuel_type}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, fuel_type: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Transmission</Label>
                        <Input
                          value={vehicleEditForm.transmission}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, transmission: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Engine (cc)</Label>
                        <Input
                          inputMode="numeric"
                          value={vehicleEditForm.engine_cc}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, engine_cc: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Fuel tank (L)</Label>
                        <Input
                          inputMode="decimal"
                          value={vehicleEditForm.fuel_tank_capacity}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({
                              ...p,
                              fuel_tank_capacity: e.target.value,
                            }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Color</Label>
                        <Input
                          value={vehicleEditForm.color}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, color: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Seats</Label>
                        <Input
                          inputMode="numeric"
                          value={vehicleEditForm.seats}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, seats: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Mileage</Label>
                        <Input
                          value={vehicleEditForm.mileage}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, mileage: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Horsepower</Label>
                        <Input
                          value={vehicleEditForm.horsepower}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, horsepower: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Car type</Label>
                        <Input
                          value={vehicleEditForm.car_type}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, car_type: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Eco friendly</Label>
                        <Input
                          value={vehicleEditForm.eco_friendly}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, eco_friendly: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Car class</Label>
                        <Input
                          value={vehicleEditForm.car_class}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, car_class: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Location
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Street address</Label>
                        <Input
                          value={vehicleEditForm.address}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, address: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>City</Label>
                        <Input
                          value={vehicleEditForm.city}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, city: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>State</Label>
                        <Input
                          value={vehicleEditForm.state}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, state: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>ZIP</Label>
                        <Input
                          value={vehicleEditForm.zipcode}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, zipcode: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Country</Label>
                        <Input
                          value={vehicleEditForm.country}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, country: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Latitude</Label>
                        <Input
                          value={vehicleEditForm.latitude}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, latitude: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Longitude</Label>
                        <Input
                          value={vehicleEditForm.longitude}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({ ...p, longitude: e.target.value }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Title & plates
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Branded / salvage title</Label>
                        <Select
                          value={vehicleEditForm.branded_or_salvage_title}
                          onValueChange={(v) =>
                            setVehicleEditForm((p) => ({ ...p, branded_or_salvage_title: v }))
                          }
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No</SelectItem>
                            <SelectItem value="1">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tax paid</Label>
                        <Select
                          value={vehicleEditForm.tax_paid}
                          onValueChange={(v) =>
                            setVehicleEditForm((p) => ({ ...p, tax_paid: v }))
                          }
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No</SelectItem>
                            <SelectItem value="1">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>License plate</Label>
                        <Input
                          value={vehicleEditForm.license_plate_number}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({
                              ...p,
                              license_plate_number: e.target.value,
                            }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Plate state</Label>
                        <Input
                          value={vehicleEditForm.license_plate_state}
                          onChange={(e) =>
                            setVehicleEditForm((p) => ({
                              ...p,
                              license_plate_state: e.target.value,
                            }))
                          }
                          disabled={updateMut.isPending}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <div className="space-y-1.5">
                      <Label>Public description</Label>
                      <Textarea
                        rows={4}
                        value={vehicleEditForm.description}
                        onChange={(e) =>
                          setVehicleEditForm((p) => ({ ...p, description: e.target.value }))
                        }
                        disabled={updateMut.isPending}
                        className="min-h-[100px] resize-y"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Renter instructions</Label>
                      <Textarea
                        rows={3}
                        value={vehicleEditForm.instructions}
                        onChange={(e) =>
                          setVehicleEditForm((p) => ({ ...p, instructions: e.target.value }))
                        }
                        disabled={updateMut.isPending}
                        className="min-h-[80px] resize-y"
                      />
                    </div>
                  </section>
                </div>
                <SheetFooter className="mt-0 border-t border-border bg-background p-4 sm:flex-col sm:space-x-0 sm:space-y-2">
                  <Button
                    type="button"
                    className="w-full bg-primary text-primary-foreground"
                    onClick={() => void handleSaveVehicle()}
                    disabled={updateMut.isPending}
                  >
                    {updateMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </SheetFooter>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

export default VehiclesPage;
