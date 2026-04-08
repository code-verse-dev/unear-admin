import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { CarFront, Eye, Edit, Trash2, KeyRound, Loader2, Camera } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { USERS_PAGE_SIZE_DEFAULT, type AppUser, type UsersListParams } from "@/api/users";
import {
  VEHICLE_STATUS,
  getVehicle,
  vehicleDetailQueryKey,
  vehicleListingImageUrls,
  type AdminVehicle,
} from "@/api/vehicles";
import { useVehiclesForUserQuery } from "@/hooks/useAdminVehicles";
import {
  useUsersListQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useSetUserPasswordMutation,
  useToggleUserVerificationMutation,
} from "@/hooks/useAdminUsers";
import { resolveMediaUrl } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

function displayName(u: AppUser) {
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.name || u.nickname || u.email || `User #${u.id}`;
}

function userInitials(u: AppUser): string {
  const base =
    [u.firstname, u.lastname].filter(Boolean).join(" ").trim() ||
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

function accountLabel(u: AppUser): { label: string; variant: "success" | "destructive" | "warning" } {
  if (u.is_blocked) return { label: "Blocked", variant: "destructive" };
  if (!u.is_activated) return { label: "Deactivated", variant: "warning" };
  return { label: "Active", variant: "success" };
}

function vehicleStatusLabel(status: number): string {
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

function vehicleStatusVariant(
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

function displayVehicleOwner(v: AdminVehicle): string {
  const o = v.owner;
  if (!o) return `User #${v.user_id}`;
  const n = [o.firstname, o.lastname].filter(Boolean).join(" ").trim();
  return n || `User #${o.id}`;
}

function vehicleOwnerInitials(v: AdminVehicle): string {
  const o = v.owner;
  if (!o) return "?";
  const a = (o.firstname?.[0] || "").toUpperCase();
  const b = (o.lastname?.[0] || "").toUpperCase();
  if (a && b) return `${a}${b}`;
  return (a || b || "?").slice(0, 2);
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

type UserSheetMode = "view" | "edit";

const UsersPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accountStatus, setAccountStatus] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  const [userSheetMode, setUserSheetMode] = useState<UserSheetMode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstname: "",
    lastname: "",
    nickname: "",
    is_activated: "true",
  });
  const [newPassword, setNewPassword] = useState("");
  const [vehicleDetailId, setVehicleDetailId] = useState<number | null>(null);
  const [vehicleDetailSeed, setVehicleDetailSeed] = useState<AdminVehicle | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, accountStatus, verificationFilter]);

  const listParams: UsersListParams = useMemo(
    () => ({
      page,
      limit: USERS_PAGE_SIZE_DEFAULT,
      search: debouncedSearch || undefined,
      accountStatus:
        accountStatus === "all"
          ? "all"
          : (accountStatus as UsersListParams["accountStatus"]),
      verification:
        verificationFilter === "all"
          ? "all"
          : (verificationFilter as UsersListParams["verification"]),
    }),
    [page, debouncedSearch, accountStatus, verificationFilter]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useUsersListQuery(listParams);
  const {
    data: userVehiclesData,
    isLoading: userVehiclesLoading,
    isError: userVehiclesError,
  } = useVehiclesForUserQuery(selectedUser?.id ?? null, userSheetMode === "view");

  const {
    data: vehicleDetailFetched,
    isFetching: vehicleDetailFetching,
    isError: vehicleDetailError,
  } = useQuery({
    queryKey: vehicleDetailId != null ? vehicleDetailQueryKey(vehicleDetailId) : ["admin", "vehicles", "detail", "none"],
    queryFn: () => getVehicle(vehicleDetailId!),
    enabled: vehicleDetailId != null,
    placeholderData:
      vehicleDetailSeed && vehicleDetailId != null && vehicleDetailSeed.id === vehicleDetailId
        ? vehicleDetailSeed
        : undefined,
  });

  const vehicleDetailOpen = vehicleDetailId != null;
  const vehicleDetail = vehicleDetailFetched ?? vehicleDetailSeed ?? null;

  const updateMut = useUpdateUserMutation();
  const deleteMut = useDeleteUserMutation();
  const blockMut = useBlockUserMutation();
  const unblockMut = useUnblockUserMutation();
  const passwordMut = useSetUserPasswordMutation();
  const verifyMut = useToggleUserVerificationMutation();

  const busy =
    updateMut.isPending ||
    deleteMut.isPending ||
    blockMut.isPending ||
    unblockMut.isPending ||
    passwordMut.isPending ||
    verifyMut.isPending;

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openViewSheet = (u: AppUser) => {
    setSelectedUser(u);
    setUserSheetMode("view");
  };

  const openEditSheet = (u: AppUser) => {
    setAvatarDraftUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAvatarFile(null);
    setSelectedUser(u);
    setUserSheetMode("edit");
  };

  useEffect(() => {
    if (userSheetMode !== "edit") {
      setAvatarDraftUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setAvatarFile(null);
    }
  }, [userSheetMode]);

  useEffect(() => {
    if (userSheetMode !== null) return;
    setVehicleDetailId(null);
    setVehicleDetailSeed(null);
  }, [userSheetMode]);

  useEffect(() => {
    if (userSheetMode !== "edit" || !selectedUser) return;
    setEditForm({
      firstname: selectedUser.firstname || "",
      lastname: selectedUser.lastname || "",
      nickname: selectedUser.nickname || "",
      is_activated: selectedUser.is_activated ? "true" : "false",
    });
  }, [userSheetMode, selectedUser]);

  const onAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5 MB.", variant: "destructive" });
      return;
    }
    setAvatarDraftUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setAvatarFile(f);
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;
    if (!editForm.firstname.trim() || !editForm.lastname.trim()) {
      toast({ title: "Validation", description: "First and last name are required.", variant: "destructive" });
      return;
    }
    try {
      const updated = await updateMut.mutateAsync({
        id: selectedUser.id,
        body: {
          firstname: editForm.firstname.trim(),
          lastname: editForm.lastname.trim(),
          nickname: editForm.nickname.trim() || undefined,
          is_activated: editForm.is_activated === "true",
        },
        avatarFile: avatarFile ?? undefined,
      });
      setSelectedUser(updated);
      setAvatarDraftUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setAvatarFile(null);
      toast({ title: "User updated", description: `${displayName(updated)} saved.` });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteMut.mutateAsync(selectedUser.id);
      toast({ title: "User deleted", description: `${displayName(selectedUser)} was removed.` });
      setDeleteDialogOpen(false);
      setUserSheetMode(null);
      setSelectedUser(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8 || newPassword.length > 30) {
      toast({
        title: "Invalid password",
        description: "Password must be 8–30 characters.",
        variant: "destructive",
      });
      return;
    }
    try {
      await passwordMut.mutateAsync({ id: selectedUser.id, new_password: newPassword });
      toast({ title: "Password updated", description: `Credentials updated for ${selectedUser.email}.` });
      setResetDialogOpen(false);
      setNewPassword("");
    } catch (e) {
      toast({
        title: "Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleAccountCellClick = async (u: AppUser) => {
    try {
      if (u.is_blocked) {
        await unblockMut.mutateAsync(u.id);
        toast({ title: "User unblocked", description: displayName(u) });
        return;
      }
      if (!u.is_activated) {
        await updateMut.mutateAsync({ id: u.id, body: { is_activated: true } });
        toast({ title: "Account activated", description: displayName(u) });
        return;
      }
      await blockMut.mutateAsync(u.id);
      toast({ title: "User blocked", description: displayName(u) });
    } catch (e) {
      toast({
        title: "Request failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const toggleVerification = async (u: AppUser) => {
    try {
      await verifyMut.mutateAsync(u.id);
      toast({ title: "Verification updated", description: displayName(u) });
    } catch (e) {
      toast({
        title: "Request failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AppUser>[] = [
    { key: "id", header: "ID", render: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "image_url",
      header: "Photo",
      className: "w-[52px]",
      render: (row) => (
        <Avatar className="h-9 w-9 border border-border shadow-none">
          <AvatarImage src={resolveMediaUrl(row.image_url)} alt="" className="object-cover" />
          <AvatarFallback className="text-[10px] font-semibold">{userInitials(row)}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium">{displayName(row)}</span>,
    },
    { key: "email", header: "Email" },
    {
      key: "mobile_no",
      header: "Phone",
      render: (row) => <span>{row.mobile_no || "—"}</span>,
    },
    {
      key: "is_verified",
      header: "Verification",
      render: (row) => {
        const verifying = verifyMut.isPending && verifyMut.variables === row.id;
        return (
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-8 py-0.5 px-1.5 -ml-1.5 gap-1.5 hover:bg-muted/80"
            title={row.is_verified ? "Mark verification as pending" : "Mark as verified"}
            disabled={busy}
            onClick={() => void toggleVerification(row)}
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : null}
            <StatusBadge variant={row.is_verified ? "success" : "warning"}>
              {row.is_verified ? "Verified" : "Pending"}
            </StatusBadge>
          </Button>
        );
      },
    },
    {
      key: "status",
      header: "Account",
      render: (row) => {
        const { label, variant } = accountLabel(row);
        const accountPending =
          (blockMut.isPending && blockMut.variables === row.id) ||
          (unblockMut.isPending && unblockMut.variables === row.id) ||
          (updateMut.isPending && updateMut.variables?.id === row.id);
        const accountTitle = row.is_blocked
          ? "Unblock user"
          : !row.is_activated
            ? "Activate account (allow sign-in)"
            : "Block user";
        return (
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-8 py-0.5 px-1.5 -ml-1.5 gap-1.5 hover:bg-muted/80"
            title={accountTitle}
            disabled={busy}
            onClick={() => void handleAccountCellClick(row)}
          >
            {accountPending ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : null}
            <StatusBadge variant={variant}>{label}</StatusBadge>
          </Button>
        );
      },
    },
    {
      key: "createdAt",
      header: "Registered",
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
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            title="Edit"
            disabled={busy}
            onClick={() => openEditSheet(row)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            title="Set password"
            disabled={busy}
            onClick={() => {
              setSelectedUser(row);
              setNewPassword("");
              setResetDialogOpen(true);
            }}
          >
            <KeyRound className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            title="Delete"
            disabled={busy}
            onClick={() => {
              setSelectedUser(row);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Users" subtitle="Manage platform users" fullWidth>
      <div className="mb-4 flex flex-col gap-2">
        <SearchFilter
          searchPlaceholder="Search by name, nickname, or email..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching && !isLoading}
          filters={[
            {
              label: "Account",
              value: accountStatus,
              onChange: setAccountStatus,
              options: [
                { label: "All accounts", value: "all" },
                { label: "Active", value: "active" },
                { label: "Blocked", value: "blocked" },
                { label: "Deactivated", value: "deactivated" },
              ],
            },
            {
              label: "Verification",
              value: verificationFilter,
              onChange: setVerificationFilter,
              options: [
                { label: "All", value: "all" },
                { label: "Verified", value: "verified" },
                { label: "Pending", value: "pending" },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setAccountStatus("all");
            setVerificationFilter("all");
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
          getRowId={(u) => u.id}
          emptyMessage="No users match your filters."
          isLoading={isLoading}
          pageSize={listParams.limit ?? USERS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          skeletonRowCount={listParams.limit ?? USERS_PAGE_SIZE_DEFAULT}
        />
      </div>

      <Sheet
        open={userSheetMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUserSheetMode(null);
            setSelectedUser(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full flex-col gap-0 overflow-hidden p-0",
            userSheetMode === "view" && "sm:max-w-xl",
            userSheetMode === "edit" && "sm:max-w-md"
          )}
        >
          <SheetDescription className="sr-only">
            {userSheetMode === "view"
              ? "User details and vehicle listings."
              : userSheetMode === "edit"
                ? "Edit user profile."
                : ""}
          </SheetDescription>
          {selectedUser && userSheetMode === "view" ? (
            <SheetTitle className="sr-only">{displayName(selectedUser)} — user details</SheetTitle>
          ) : selectedUser && userSheetMode === "edit" ? (
            <SheetTitle className="sr-only">Edit {displayName(selectedUser)}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">User</SheetTitle>
          )}

          {selectedUser && userSheetMode === "view" ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pr-8">
              <div className="mb-6 flex flex-row items-center gap-4 text-left">
                <Avatar className="h-16 w-16 shrink-0 border-2 border-border shadow-sm">
                  <AvatarImage src={resolveMediaUrl(selectedUser.image_url)} alt="" className="object-cover" />
                  <AvatarFallback className="text-lg font-semibold">{userInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                    {displayName(selectedUser)}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-medium font-mono text-foreground">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">{selectedUser.mobile_no || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Verification</span>
                  <StatusBadge variant={selectedUser.is_verified ? "success" : "warning"}>
                    {selectedUser.is_verified ? "Verified" : "Pending"}
                  </StatusBadge>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Account</span>
                  <StatusBadge variant={accountLabel(selectedUser).variant}>
                    {accountLabel(selectedUser).label}
                  </StatusBadge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-medium text-foreground">{formatDateUS(selectedUser.createdAt)}</span>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Vehicles</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Click a listing for full details</p>
                </div>
                {userVehiclesLoading ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading listings…
                  </div>
                ) : userVehiclesError ? (
                  <p className="py-4 text-sm text-muted-foreground">Could not load vehicles.</p>
                ) : (userVehiclesData?.rows ?? []).length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No vehicle listings for this user.</p>
                ) : (
                  <ul className="space-y-2">
                    {(userVehiclesData?.rows ?? []).map((v: AdminVehicle) => {
                      const thumbs = vehicleListingImageUrls(v);
                      return (
                        <li key={v.id}>
                          <button
                            type="button"
                            className="flex w-full gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => {
                              setVehicleDetailId(v.id);
                              setVehicleDetailSeed(v);
                            }}
                          >
                            <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
                              {thumbs[0] ? (
                                <img
                                  src={thumbs[0]}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <CarFront className="h-6 w-6" aria-hidden />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium leading-tight text-foreground">
                                {[v.make, v.model].filter(Boolean).join(" ")}
                                {v.year != null ? ` · ${v.year}` : ""}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <StatusBadge variant={vehicleStatusVariant(v.status)}>
                                  {vehicleStatusLabel(v.status)}
                                </StatusBadge>
                                {v.blocked_by_admin ? (
                                  <StatusBadge variant="destructive">Restricted</StatusBadge>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {selectedUser && userSheetMode === "edit" ? (
            <div className="flex min-h-0 flex-1 flex-col border-border bg-muted/25">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="space-y-1 text-left">
                  <h3 className="text-base font-semibold text-foreground">Edit profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Name, photo, and account status. Email and phone are not changed here.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 pb-1">
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    aria-label="Choose profile photo"
                    onChange={onAvatarFileChange}
                  />
                  <button
                    type="button"
                    disabled={updateMut.isPending}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="group relative shrink-0 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Upload profile photo"
                  >
                    <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                      <AvatarImage
                        src={avatarDraftUrl ?? resolveMediaUrl(selectedUser.image_url)}
                        alt=""
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl font-semibold">
                        {userInitials(selectedUser)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Camera className="h-6 w-6 text-white" aria-hidden />
                    </span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-edit-firstname">First name</Label>
                  <Input
                    id="user-edit-firstname"
                    value={editForm.firstname}
                    onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-edit-lastname">Last name</Label>
                  <Input
                    id="user-edit-lastname"
                    value={editForm.lastname}
                    onChange={(e) => setEditForm({ ...editForm, lastname: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-edit-nickname">Nickname</Label>
                  <Input
                    id="user-edit-nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account active</Label>
                  <Select
                    value={editForm.is_activated}
                    onValueChange={(v) => setEditForm({ ...editForm, is_activated: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active (can sign in)</SelectItem>
                      <SelectItem value="false">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="border-t border-border bg-background p-4 sm:flex-col sm:space-x-0 sm:space-y-2">
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={() => void handleEditSave()}
                  disabled={updateMut.isPending}
                >
                  {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={vehicleDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            setVehicleDetailId(null);
            setVehicleDetailSeed(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex max-h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <SheetDescription className="sr-only">Vehicle listing details</SheetDescription>
          {vehicleDetail ? (
            <>
              <SheetTitle className="sr-only">
                {vehicleDetail.make} {vehicleDetail.model} {vehicleDetail.year}
              </SheetTitle>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-1 flex items-start justify-between gap-2 pr-2">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight text-foreground">Vehicle details</h2>
                    <p className="text-sm text-muted-foreground">
                      {[vehicleDetail.make, vehicleDetail.model].filter(Boolean).join(" ")}
                      {vehicleDetail.year != null ? ` (${vehicleDetail.year})` : ""}
                    </p>
                  </div>
                  {vehicleDetailFetching ? (
                    <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                </div>
                {vehicleDetailError ? (
                  <p className="mb-4 text-xs text-destructive">Could not refresh full details; showing cached data.</p>
                ) : null}

                <div className="space-y-3 py-2 text-sm">
                  {vehicleListingImageUrls(vehicleDetail).length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Listing images</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {vehicleListingImageUrls(vehicleDetail).map((src, i) => (
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
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-border shadow-sm">
                      <AvatarImage
                        src={resolveMediaUrl(vehicleDetail.owner?.image_url)}
                        alt=""
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-semibold">
                        {vehicleOwnerInitials(vehicleDetail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="truncate font-medium text-foreground">
                        {displayVehicleOwner(vehicleDetail)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono font-medium">{vehicleDetail.id}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="break-all text-right font-mono font-medium">{vehicleDetail.vin || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Listing type</span>
                    <span className="font-medium">{listingTypeLabel(vehicleDetail.type)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge variant={vehicleStatusVariant(vehicleDetail.status)}>
                      {vehicleStatusLabel(vehicleDetail.status)}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Restricted</span>
                    <StatusBadge variant={vehicleDetail.blocked_by_admin ? "destructive" : "success"}>
                      {vehicleDetail.blocked_by_admin ? "Yes" : "No"}
                    </StatusBadge>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-right font-medium">
                      {[vehicleDetail.city, vehicleDetail.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">
                      {vehicleDetail.price != null
                        ? `$${Number(vehicleDetail.price).toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Plate</span>
                    <span className="font-medium">
                      {vehicleDetail.license_plate_number
                        ? `${vehicleDetail.license_plate_number}${
                            vehicleDetail.license_plate_state
                              ? ` (${vehicleDetail.license_plate_state})`
                              : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Listed</span>
                    <span className="font-medium">{formatDateUS(vehicleDetail.createdAt)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <SheetTitle className="sr-only">Vehicle details</SheetTitle>
              <div className="flex flex-1 items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove {selectedUser ? displayName(selectedUser) : "this user"}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set password</AlertDialogTitle>
            <AlertDialogDescription>
              New password for {selectedUser?.email} (8–30 characters). User will need to sign in with this password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={passwordMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleResetPassword();
              }}
              className="bg-primary text-primary-foreground"
              disabled={passwordMut.isPending}
            >
              {passwordMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default UsersPage;
