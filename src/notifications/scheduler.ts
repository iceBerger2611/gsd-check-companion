import { addMinutes } from "date-fns";
import {
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
} from "expo-notifications";
import { toMinutes } from "../components/OverrideWindowSettings";
import { FollowupType } from "../db/schema";
import { isTargetInWindow } from "../processReading/utils";
import {
  FollowupRow,
  getFollowupByIdSafe,
  upsertFollowup,
} from "../repos/local/followups.repo";
import { PatientSettingsRow } from "../repos/local/patientSettings.repo";
import { ReadingRow } from "../repos/local/readings.repo";

export type NotificationData = {
  followup: FollowupType;
  followupId: string;
  readingId: string;
};

export const cancelNotificationsOfFollowup = async (followupId: string) => {
  const followup = await getFollowupByIdSafe(followupId);
  if (!followup) return;
  if (!followup?.scheduledNotificationIds?.length) return;
  const followupNotificationIds = followup.scheduledNotificationIds;
  const activeNotifications = await getAllScheduledNotificationsAsync();
  if (!activeNotifications.length) {
    await upsertFollowup({
      ...followup,
      scheduledNotificationIds: [],
    });
    return;
  }
  const activeIds = new Set(
    activeNotifications.map((notification) => notification.identifier),
  );

  const notificationIdsToCancel = followupNotificationIds.filter((id) =>
    activeIds.has(id),
  );

  if (!notificationIdsToCancel.length) {
    await upsertFollowup({
      ...followup,
      scheduledNotificationIds: [],
    });
    return;
  }

  const results = await Promise.allSettled(
    notificationIdsToCancel.map((notificationId) =>
      cancelScheduledNotificationAsync(notificationId),
    ),
  );
  const remainingNotificationIds = notificationIdsToCancel.filter(
    (_, index) => {
      return results[index]?.status !== "fulfilled";
    },
  );

  await upsertFollowup({
    ...followup,
    scheduledNotificationIds: remainingNotificationIds,
  });
};

export const scheduleNextNotifications = async (
  reading: ReadingRow,
  followup: FollowupRow,
  notificationDate: Date,
  personalSettings: PatientSettingsRow,
) => {
  const isInWindow =
    personalSettings.windowStartMinuteOfDay &&
    personalSettings.windowEndMinuteOfDay &&
    isTargetInWindow(
      toMinutes(notificationDate),
      personalSettings.windowStartMinuteOfDay,
      personalSettings.windowEndMinuteOfDay,
    );

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
    Array.from(
      {
        length: isInWindow
          ? personalSettings.windowNotificationCount ||
            personalSettings.notificationCount
          : personalSettings.notificationCount,
      },
      (_, index) =>
        scheduleNotificationAsync({
          identifier: `${followup.id}-${index}`,
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
            date: addMinutes(
              notificationDate,
              index *
                (isInWindow
                  ? personalSettings.windowNotificationSpacingMinutes ||
                    personalSettings.notificationSpacingMinutes
                  : personalSettings.notificationSpacingMinutes),
            ),
          },
        }),
    ),
  );

  return scheduledResults;
};

export const getNotificationIdsByEntity = async (
  entityId: string,
): Promise<string[]> => {
  const activeNotifications = await getAllScheduledNotificationsAsync();
  const entityNotifications = activeNotifications.filter((notification) =>
    notification.identifier.startsWith(`${entityId}-`),
  );
  return entityNotifications.map((notification) => notification.identifier);
};
