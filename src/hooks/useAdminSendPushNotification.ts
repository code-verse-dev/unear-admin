import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendAdminPushNotification, type SendAdminPushBody } from "@/api/adminPushNotification";

export function useAdminSendPushNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendAdminPushBody) => sendAdminPushNotification(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "activity-notifications"] });
    },
  });
}
