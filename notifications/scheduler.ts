import { FollowupType } from "@/db/schema";
import { FollowupRow } from "@/repos/local/followups.repo";
import { ReadingRow } from "@/repos/local/readings.repo";
import { addMinutes } from "date-fns";
import {
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync
} from "expo-notifications";

export type NotificationData = {
  followup: FollowupType;
  followupId: string;
  readingId: string;
};

export const scheduleNextNotifications = async (
  reading: ReadingRow,
  followup: FollowupRow,
  notificationDate: Date,
) => {
  const finalDecision = reading.finalDecision;

  const titleMessage =
    finalDecision?.type === "followup"
      ? finalDecision.followupType === "drink_cornstarch"
        ? "Drink Cornstarch"
        : "Check your Blood Sugar Level"
      : finalDecision?.intervention === "consume_glucose"
        ? "Check your Blood Sugar Level"
        : "Drink Cornstarch";

  const chosenFollowup: FollowupType =
    finalDecision?.type === "followup"
      ? finalDecision.followupType
      : finalDecision?.intervention === "consume_glucose"
        ? "recheck"
        : "drink_cornstarch";

  const scheduledResults = await Promise.allSettled(
    Array.from({ length: 1 }, (_, index) =>
      scheduleNotificationAsync({
        content: {
          title: `Time to ${titleMessage}!`,
          body: "Tap here to complete the action",
          interruptionLevel: "timeSensitive",
          data: {
            followup: chosenFollowup,
            readingId: reading.id,
            followupId: followup.id,
          },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: addMinutes(notificationDate, index * 2),
        },
      }),
    ),
  );

  return scheduledResults;
};
