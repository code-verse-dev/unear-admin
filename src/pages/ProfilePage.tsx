import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, Save, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminProfileQuery, useChangeAdminPasswordMutation, usePatchAdminProfileMutation } from "@/hooks/useAdminProfile";
import { resolveMediaUrl } from "@/lib/admin-api";
import { clearAdminSession } from "@/lib/auth-session";
import { useQueryClient } from "@tanstack/react-query";

const ProfilePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminProfileQuery();
  const patchMut = usePatchAdminProfileMutation();
  const pwdMut = useChangeAdminPasswordMutation();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!data) return;
    setFirstname(data.firstname ?? "");
    setLastname(data.lastname ?? "");
  }, [data]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Could not load profile", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const displayImage = previewUrl ?? (data?.image_url ? resolveMediaUrl(data.image_url) : undefined);
  const initials = useMemo(() => {
    const a = (firstname || data?.firstname || "").trim().charAt(0);
    const b = (lastname || data?.lastname || "").trim().charAt(0);
    if (a || b) return `${a}${b}`.toUpperCase();
    const e = (data?.email || "?").charAt(0);
    return e.toUpperCase();
  }, [firstname, lastname, data?.firstname, data?.lastname, data?.email]);

  const onSaveProfile = () => {
    patchMut.mutate(
      {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        imageFile: pendingFile,
      },
      {
        onSuccess: () => {
          setPendingFile(null);
          if (fileRef.current) fileRef.current.value = "";
          toast({ title: "Profile updated" });
        },
        onError: (e) =>
          toast({
            title: "Update failed",
            description: e instanceof Error ? e.message : "Try again.",
            variant: "destructive",
          }),
      }
    );
  };

  const onChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "New password and confirmation do not match.", variant: "destructive" });
      return;
    }
    pwdMut.mutate(
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      {
        onSuccess: () => {
          toast({
            title: "Password updated",
            description: "Please sign in again with your new password.",
          });
          clearAdminSession();
          qc.clear();
          navigate("/login?reason=password", { replace: true });
        },
        onError: (err) =>
          toast({
            title: "Could not change password",
            description: err instanceof Error ? err.message : "Try again.",
            variant: "destructive",
          }),
      }
    );
  };

  if (isLoading && !data) {
    return (
      <PageContainer fullWidth title="Profile">
        <div className="admin-card flex items-center gap-2 py-14 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          Loading…
        </div>
      </PageContainer>
    );
  }

  if (isError && !data) {
    return (
      <PageContainer fullWidth title="Profile">
        <div className="admin-card flex flex-col items-start gap-4 py-10 text-muted-foreground">
          <p className="text-sm">Could not load profile.</p>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry"}
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!data) return null;

  return (
    <PageContainer fullWidth title="Profile" subtitle="Your account photo, name, and password">
      <div className="grid max-w-2xl gap-6">
        <section className="admin-card space-y-6">
          <h2 className="font-['DM_Sans',system-ui,sans-serif] text-base font-semibold text-card-foreground">Photo & name</h2>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Avatar className="h-24 w-24 border border-border">
                <AvatarImage src={displayImage} alt="" className="object-cover" />
                <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  setPendingFile(f ?? null);
                }}
              />
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" />
                Choose photo
              </Button>
              {pendingFile ? (
                <p className="max-w-[200px] truncate text-center text-xs text-muted-foreground sm:text-left">{pendingFile.name}</p>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={data.email} disabled className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-firstname">First name</Label>
                <Input id="profile-firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-lastname">Last name</Label>
                <Input id="profile-lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} className="bg-background" />
              </div>
            </div>
          </div>

          <Button type="button" onClick={onSaveProfile} disabled={patchMut.isPending} className="gap-2">
            {patchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </Button>
        </section>

        <section className="admin-card space-y-4">
          <h2 className="font-['DM_Sans',system-ui,sans-serif] text-base font-semibold text-card-foreground">Change password</h2>
          <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="pwd-current">Current password</Label>
              <Input
                id="pwd-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-new">New password</Label>
              <Input
                id="pwd-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-confirm">Confirm new password</Label>
              <Input
                id="pwd-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button type="submit" disabled={pwdMut.isPending} className="gap-2">
              {pwdMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </Button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
