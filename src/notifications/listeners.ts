import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { getFollowupByIdSafe } from "../repos/local/followups.repo";
import { getReadingByIdSafe } from "../repos/local/readings.repo";
import { NotificationData } from "./scheduler";

async function handleNotificationResponse(
  response: Notifications.NotificationResponse | null,
) {
  if (!response) return;

  const data = response.notification.request.content
    .data as Partial<NotificationData>;

  if (!data.followup || !data.followupId || !data.readingId) return;

  const followup = await getFollowupByIdSafe(data.followupId);
  const reading = await getReadingByIdSafe(data.readingId);

  if (followup && reading) {
    router.push({
      pathname: "/(patient)/log",
      params: {
        followupType: data.followup,
        followupId: data.followupId,
        readingId: data.readingId,
      },
    });
    return;
  }
  router.push({
    pathname: "/(patient)",
  });
  return;
}

export function useNotificationRouting() {
  useEffect(() => {
    // App opened from a notification tap
    Notifications.getLastNotificationResponseAsync().then(async (response) => {
      await handleNotificationResponse(response);
    });

    // App already running / resumed and user taps a notification
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        await handleNotificationResponse(response);
      },
    );

    return () => {
      sub.remove();
    };
  }, []);
}
