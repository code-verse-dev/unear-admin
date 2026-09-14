import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, KeyRound, Loader2, Camera } from "lucide-react";
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
  useUsersListQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useSetUserPasswordMutation,
} from "@/hooks/useAdminUsers";
import { resolveMediaUrl } from "@/lib/admin-api";
import { accountLabel, displayName, formatDateUS, userInitials } from "@/lib/usersDisplay";

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

type UserSheetMode = "edit";

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const verificationFromUrl = searchParams.get("verification");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accountStatus, setAccountStatus] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>(
    verificationFromUrl === "pending" || verificationFromUrl === "verified" ? verificationFromUrl : "all"
  );

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const v = searchParams.get("verification");
    const next = v === "pending" || v === "verified" ? v : "all";
    setVerificationFilter((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const setVerification = (value: string) => {
    setVerificationFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("verification");
    else next.set("verification", value);
    setSearchParams(next, { replace: true });
  };

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

  const updateMut = useUpdateUserMutation();
  const deleteMut = useDeleteUserMutation();
  const blockMut = useBlockUserMutation();
  const unblockMut = useUnblockUserMutation();
  const passwordMut = useSetUserPasswordMutation();

  const busy =
    updateMut.isPending ||
    deleteMut.isPending ||
    blockMut.isPending ||
    unblockMut.isPending ||
    passwordMut.isPending;

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openUserDetail = (u: AppUser) => {
    navigate(`/users/${u.id}`);
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
      render: (row) => (
        <StatusBadge variant={row.is_verified ? "success" : "warning"}>
          {row.is_verified ? "Verified" : "Pending"}
        </StatusBadge>
      ),
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
            title="Review profile"
            disabled={busy}
            onClick={() => openUserDetail(row)}
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
              onChange: setVerification,
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
            setVerification("all");
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
          onRowClick={openUserDetail}
          emptyMessage="No users match your filters."
          isLoading={isLoading}
          pageSize={listParams.limit ?? USERS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          skeletonRowCount={listParams.limit ?? USERS_PAGE_SIZE_DEFAULT}
        />
      </div>

      <Sheet
        open={userSheetMode === "edit"}
        onOpenChange={(open) => {
          if (!open) {
            setUserSheetMode(null);
            setSelectedUser(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <SheetDescription className="sr-only">Edit user profile.</SheetDescription>
          {selectedUser && userSheetMode === "edit" ? (
            <SheetTitle className="sr-only">Edit {displayName(selectedUser)}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">Edit user</SheetTitle>
          )}

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
