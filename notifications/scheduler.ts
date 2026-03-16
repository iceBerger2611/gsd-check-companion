import { FollowupType } from "@/db/schema";
import { FollowupRow } from "@/repos/local/followups.repo";
import { ReadingRow } from "@/repos/local/readings.repo";
import { addMinutes } from "date-fns";
import {
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
} from "expo-notifications";

//TODO immediately! : when processicg a reading take two paths:
// 1. check (already done) 2. drink cornstarch.
// in each scenario create a followup in the relevant time (3h or followup delay or calculate intervention)

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
