import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

export type PushAudience = "all" | "hosts" | "renters" | "specific";

export type SendAdminPushBody = {
  title: string;
  message: string;
  audience?: PushAudience;
  user_ids?: number[];
};

export type SendAdminPushResult = {
  recipients: number;
};

export async function sendAdminPushNotification(body: SendAdminPushBody): Promise<SendAdminPushResult> {
  const json = await adminFetch<ApiSuccess<SendAdminPushResult>>("/api/admin/send-notification", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      title: body.title.trim(),
      message: body.message.trim(),
      audience: body.audience ?? "all",
      ...(body.audience === "specific" && body.user_ids?.length ? { user_ids: body.user_ids } : {}),
    }),
  });
  return json.data;
}
