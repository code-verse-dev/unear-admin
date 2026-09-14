import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CarFront,
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import StatusBadge from "@/components/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useUserDetailQuery, useToggleUserVerificationMutation } from "@/hooks/useAdminUsers";
import { useVehiclesForUserQuery } from "@/hooks/useAdminVehicles";
import { resolveMediaUrl } from "@/lib/admin-api";
import { accountLabel, displayName, formatDateUS, textOrDash, userInitials } from "@/lib/usersDisplay";
import { VEHICLE_STATUS, vehicleListingImageUrls, type AdminVehicle } from "@/api/vehicles";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function isImageUrl(url: string) {
  if (IMAGE_EXT.test(url)) return true;
  if (/^data:image\//i.test(url)) return true;
  return !/\.(pdf|doc|docx|zip)(\?|#|$)/i.test(url);
}

function DocumentCard({
  label,
  url,
  onPreview,
}: {
  label: string;
  url?: string | null;
  onPreview: (src: string) => void;
}) {
  const src = resolveMediaUrl(url);
  if (!src) {
    return (
      <div className="flex min-h-[11rem] flex-col rounded-lg border border-dashed border-border bg-muted/20 p-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">Not uploaded</div>
      </div>
    );
  }

  const image = isImageUrl(src);
  return (
    <div className="flex min-h-[11rem] flex-col overflow-hidden rounded-lg border border-border bg-muted/20">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      </div>
      {image ? (
        <button
          type="button"
          className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
          onClick={() => onPreview(src)}
        >
          <img src={src} alt={label} className="h-full w-full object-cover" />
        </button>
      ) : (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground"
        >
          <FileText className="h-5 w-5" />
          View file
        </a>
      )}
    </div>
  );
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

const UserDetailPage = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = Number(idParam);
  const valid = Number.isFinite(id) && id > 0;

  const { data: user, isLoading, isError, error, refetch } = useUserDetailQuery(valid ? id : null, valid);
  const { data: vehiclesData, isLoading: vehiclesLoading, isError: vehiclesError } = useVehiclesForUserQuery(
    valid ? id : null,
    valid
  );
  const verifyMut = useToggleUserVerificationMutation();

  const [preview, setPreview] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"approve" | "revoke" | null>(null);

  const runVerification = async (next: boolean) => {
    if (!user) return;
    try {
      await verifyMut.mutateAsync({ id: user.id, is_verified: next });
      toast({
        title: next ? "Profile approved" : "Approval revoked",
        description: displayName(user),
      });
      setConfirm(null);
    } catch (e) {
      toast({
        title: "Request failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (!valid) {
    return (
      <PageContainer title="User" subtitle="Invalid user id">
        <Button variant="outline" onClick={() => navigate("/users")}>
          Back to users
        </Button>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="User" subtitle="Loading profile…">
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading user details…
        </div>
      </PageContainer>
    );
  }

  if (isError || !user) {
    return (
      <PageContainer title="User" subtitle="Could not load this profile">
        <p className="mb-4 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "User not found."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/users")}>
            Back to users
          </Button>
          <Button variant="ghost" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  const account = accountLabel(user);
  const documents: { label: string; url?: string | null }[] = [
    { label: "ID card — front", url: user.id_card_front },
    { label: "ID card — back", url: user.id_card_back },
    { label: "Driver license — front", url: user.driving_license_front },
    { label: "Driver license — back", url: user.driving_license_back },
  ];
  const uploadedCount = documents.filter((d) => resolveMediaUrl(d.url)).length;

  return (
    <PageContainer
      title={displayName(user)}
      subtitle="Review submitted profile details and documents before approval"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/users")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Users
          </Button>
          {user.is_verified ? (
            <Button variant="outline" disabled={verifyMut.isPending} onClick={() => setConfirm("revoke")}>
              Mark pending
            </Button>
          ) : (
            <Button
              className="bg-primary text-primary-foreground"
              disabled={verifyMut.isPending}
              onClick={() => setConfirm("approve")}
            >
              {verifyMut.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              Approve profile
            </Button>
          )}
        </div>
      }
    >
      {!user.is_verified ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Profile pending review</p>
            <p className="mt-0.5 text-xs opacity-90">
              This user sees a pending-verification warning on login until you approve their profile.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Profile approved</p>
            <p className="mt-0.5 text-xs opacity-90">Identity verification is marked verified for this account.</p>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 shrink-0 border-2 border-border shadow-sm">
          <AvatarImage src={resolveMediaUrl(user.image_url)} alt="" className="object-cover" />
          <AvatarFallback className="text-xl font-semibold">{userInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight">{displayName(user)}</h2>
            <StatusBadge variant={user.is_verified ? "success" : "warning"}>
              {user.is_verified ? "Verified" : "Pending"}
            </StatusBadge>
            <StatusBadge variant={account.variant}>{account.label}</StatusBadge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            User #{user.id}
            {user.nickname ? ` · Nickname ${user.nickname}` : ""}
            {` · Joined ${formatDateUS(user.createdAt)}`}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={textOrDash(user.firstname)} />
            <Field label="Last name" value={textOrDash(user.lastname)} />
            <Field label="Nickname" value={textOrDash(user.nickname)} />
            <Field label="Date of birth" value={formatDateUS(user.dob)} />
            <Field label="Email" value={textOrDash(user.email)} />
            <Field label="Phone" value={textOrDash(user.mobile_no)} />
            <div className="sm:col-span-2">
              <Field label="About" value={textOrDash(user.about)} />
            </div>
          </div>
        </Section>

        <Section title="Address">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Street address" value={textOrDash(user.address)} />
            </div>
            <Field label="City" value={textOrDash(user.city)} />
            <Field label="Country" value={textOrDash(user.country)} />
            <Field label="ZIP / postal code" value={textOrDash(user.zipcode)} />
          </div>
        </Section>

        <Section title="Driver license details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="License number" value={textOrDash(user.license_no)} />
            <Field label="License state" value={textOrDash(user.license_state)} />
            <Field label="Age first licensed" value={textOrDash(user.age_first_licensed)} />
          </div>
        </Section>

        <Section title="Account & verification">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email verified"
              value={user.is_email_verify ? `Yes${user.email_verifyAt ? ` · ${formatDateUS(user.email_verifyAt)}` : ""}` : "No"}
            />
            <Field
              label="Mobile verified"
              value={user.is_mobile_verify ? `Yes${user.mobile_verifyAt ? ` · ${formatDateUS(user.mobile_verifyAt)}` : ""}` : "No"}
            />
            <Field label="Didit status" value={textOrDash(user.didit_verification_status)} />
            <Field label="Stripe payouts" value={user.transfer_capabilities ? "Enabled" : "Not enabled"} />
            <Field label="Connect account" value={textOrDash(user.stripe_connect_account_id)} />
            <Field
              label="Wallet"
              value={user.wallet_balance != null ? `$${Number(user.wallet_balance).toLocaleString()}` : "—"}
            />
            <Field
              label="Average rating"
              value={user.average_rating != null ? Number(user.average_rating).toFixed(2) : "—"}
            />
            <Field label="Login type" value={textOrDash(user.login_type)} />
          </div>
        </Section>
      </div>

      <div className="mt-5">
        <Section title={`Documents (${uploadedCount}/${documents.length})`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.label} label={doc.label} url={doc.url} onPreview={setPreview} />
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="Vehicles">
          {vehiclesLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading listings…
            </div>
          ) : vehiclesError ? (
            <p className="text-sm text-muted-foreground">Could not load vehicles.</p>
          ) : (vehiclesData?.rows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicle listings for this user.</p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {(vehiclesData?.rows ?? []).map((v: AdminVehicle) => {
                const thumbs = vehicleListingImageUrls(v);
                return (
                  <li key={v.id}>
                    <Link
                      to="/vehicles"
                      className="flex w-full gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
                        {thumbs[0] ? (
                          <img src={thumbs[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <CarFront className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-tight">
                          {[v.make, v.model].filter(Boolean).join(" ")}
                          {v.year != null ? ` · ${v.year}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge variant={vehicleStatusVariant(v.status)}>
                            {vehicleStatusLabel(v.status)}
                          </StatusBadge>
                          {v.blocked_by_admin ? <StatusBadge variant="destructive">Restricted</StatusBadge> : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Document preview</DialogTitle>
          {preview ? <img src={preview} alt="" className="max-h-[80vh] w-full rounded object-contain" /> : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "revoke" ? "Mark profile pending?" : "Approve this profile?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "revoke"
                ? `${displayName(user)} will see a pending-verification warning on login again.`
                : `Confirm you have reviewed ${displayName(user)}’s documents and details. They will no longer see the pending warning on login.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verifyMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={verifyMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                void runVerification(confirm !== "revoke");
              }}
            >
              {verifyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirm === "revoke" ? "Mark pending" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default UserDetailPage;
