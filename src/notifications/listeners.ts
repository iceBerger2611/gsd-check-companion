import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { NotificationData } from "./scheduler";

function handleNotificationResponse(
  response: Notifications.NotificationResponse | null,
) {
  if (!response) return;

  const data = response.notification.request.content
    .data as Partial<NotificationData>;

  if (data.followup && data.followupId && data.readingId) {
    router.push({
      pathname: "/(patient)/log",
      params: { followupType: data.followup, followupId: data.followupId, readingId: data.readingId },
    });
    return;
  }
}

export function useNotificationRouting() {
  useEffect(() => {
    // App opened from a notification tap
    Notifications.getLastNotificationResponseAsync().then(
      handleNotificationResponse,
    );

    // App already running / resumed and user taps a notification
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      },
    );

    return () => {
      sub.remove();
    };
  }, []);
}
