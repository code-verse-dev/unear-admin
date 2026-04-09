import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminSendPushNotificationMutation } from "@/hooks/useAdminSendPushNotification";
import { useUsersInfiniteListQuery } from "@/hooks/useAdminUsers";
import type { PushAudience } from "@/api/adminPushNotification";
import type { AppUser } from "@/api/users";
import { cn } from "@/lib/utils";

const TITLE_MAX = 100;
const MESSAGE_MAX = 300;

function userLabel(u: AppUser): string {
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.name || u.nickname || u.email || `User #${u.id}`;
}

const SCROLL_LOAD_THRESHOLD_PX = 72;

const PushNotificationsPage = () => {
  const { toast } = useToast();
  const sendMut = useAdminSendPushNotificationMutation();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<PushAudience>("all");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const listScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [userSearchInput]);

  const specificEnabled = audience === "specific";
  const {
    data: usersPages,
    isLoading: usersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: usersError,
    error: usersListError,
  } = useUsersInfiniteListQuery(debouncedUserSearch, specificEnabled);

  const flatUsers = useMemo(
    () => usersPages?.pages.flatMap((p) => p.rows) ?? [],
    [usersPages?.pages]
  );

  const idLabelMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const u of flatUsers) {
      m.set(u.id, userLabel(u));
    }
    return m;
  }, [flatUsers]);

  const onUserListScroll = useCallback(() => {
    const el = listScrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_LOAD_THRESHOLD_PX) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleUser = (id: number) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const removeSelected = (id: number) => {
    setSelectedUserIds((prev) => prev.filter((x) => x !== id));
  };

  const handleSend = async () => {
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      toast({ title: "Required fields", description: "Enter a title and message.", variant: "destructive" });
      return;
    }
    if (t.length > TITLE_MAX || m.length > MESSAGE_MAX) {
      toast({
        title: "Too long",
        description: `Title max ${TITLE_MAX} characters, message max ${MESSAGE_MAX}.`,
        variant: "destructive",
      });
      return;
    }
    let user_ids: number[] | undefined;
    if (audience === "specific") {
      user_ids = [...new Set(selectedUserIds)];
      if (user_ids.length === 0) {
        toast({
          title: "Select recipients",
          description: "Choose at least one user from the list.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { recipients } = await sendMut.mutateAsync({
        title: t,
        message: m,
        audience,
        ...(audience === "specific" ? { user_ids } : {}),
      });
      toast({
        title: "Notification sent",
        description:
          recipients === 0
            ? "No matching recipients (check audience or user IDs)."
            : `Queued for ${recipients} user${recipients === 1 ? "" : "s"} (in-app + push where enabled).`,
      });
      setTitle("");
      setMessage("");
      setSelectedUserIds([]);
      setUserSearchInput("");
      setAudience("all");
    } catch (e) {
      toast({
        title: "Send failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const sending = sendMut.isPending;

  return (
    <PageContainer
      fullWidth
      title="Push Notifications"
      subtitle="Send in-app notifications and Firebase push to app users (respects each user’s push settings and device token)"
    >
      <div className="grid gap-6 max-w-2xl">
        <div className="admin-card space-y-5">
          <div className="space-y-2">
            <Label htmlFor="push-title" className="text-sm font-medium">
              Title <span className="text-muted-foreground font-normal">({TITLE_MAX} max)</span>
            </Label>
            <Input
              id="push-title"
              placeholder="Short headline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              className="bg-background border-border"
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-message" className="text-sm font-medium">
              Message <span className="text-muted-foreground font-normal">({MESSAGE_MAX} max)</span>
            </Label>
            <Textarea
              id="push-message"
              placeholder="Body text shown in the notification…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={MESSAGE_MAX}
              className="bg-background border-border resize-y min-h-[100px]"
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Target audience</Label>
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as PushAudience)}
              disabled={sending}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All app users</SelectItem>
                <SelectItem value="hosts">Hosts (users with a listed vehicle)</SelectItem>
                <SelectItem value="renters">Renters (users with a rental booking)</SelectItem>
                <SelectItem value="specific">Specific users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audience === "specific" ? (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="push-user-search" className="text-sm font-medium">
                  Search users
                </Label>
                <Input
                  id="push-user-search"
                  placeholder="Name, email, or ID…"
                  value={userSearchInput}
                  onChange={(e) => setUserSearchInput(e.target.value)}
                  className="bg-background border-border"
                  disabled={sending}
                />
                <p className="text-xs text-muted-foreground">Scroll the list to load more. Tick users to include them.</p>
              </div>

              {selectedUserIds.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selected ({selectedUserIds.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUserIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-xs"
                      >
                        <span className="max-w-[200px] truncate">{idLabelMap.get(id) ?? `#${id}`}</span>
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                          onClick={() => removeSelected(id)}
                          aria-label={`Remove user ${id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedUserIds([])}>
                    Clear all
                  </Button>
                </div>
              ) : null}

              <div
                ref={listScrollRef}
                onScroll={onUserListScroll}
                className="max-h-[min(320px,50vh)] overflow-y-auto rounded-md border border-border bg-background"
              >
                {usersError ? (
                  <p className="p-4 text-sm text-destructive">
                    {usersListError instanceof Error ? usersListError.message : "Could not load users."}
                  </p>
                ) : usersLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading users…
                  </div>
                ) : flatUsers.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No users match your search.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {flatUsers.map((u) => {
                      const checked = selectedUserIds.includes(u.id);
                      return (
                        <li key={u.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50",
                              checked && "bg-secondary/10"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleUser(u.id)}
                              disabled={sending}
                              className="mt-0.5"
                              aria-label={`Select ${userLabel(u)}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium leading-tight">{userLabel(u)}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                ID {u.id}
                                {u.email ? ` · ${u.email}` : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 border-t border-border py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Loading more…
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            className="bg-primary text-primary-foreground w-full h-11 shadow-sm hover:bg-primary/90"
            disabled={sending}
            onClick={() => void handleSend()}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" aria-hidden />
            ) : (
              <Send className="w-4 h-4 mr-2 shrink-0" aria-hidden />
            )}
            Send notification
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default PushNotificationsPage;
