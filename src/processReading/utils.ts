import { addMinutes } from "date-fns";
import equal from "fast-deep-equal";
import { Action, DecisionType, FollowupType, Intervention } from "../db/schema";
import {
  cancelNotificationsOfFollowup,
  scheduleNextNotifications,
} from "../notifications/scheduler";
import {
  completeFollowup,
  FollowupInsert,
  FollowupRow,
  upsertFollowup,
} from "../repos/local/followups.repo";
import { PatientSettingsRow } from "../repos/local/patientSettings.repo";
import {
  ReadingInsert,
  ReadingRow,
  upsertReading,
} from "../repos/local/readings.repo";
import {
  listThresholdRulesByPatient,
  ThresholdRuleRow,
} from "../repos/local/thresholdRules.repo";
import { getErrorMessage } from "../repos/utils";

export type FollowupPlan = { type: FollowupType; minutes: number };

export type ReadingPlan = {
  matchedRuleId: string;
  immediateIntervention: Intervention | null;
  nexFollowup: {
    type: FollowupType;
    delayMinutes: number;
  };
};

export const resolveNextFollowupPlan = (
  plan: ReadingPlan,
  earlyDecision?: DecisionType,
): FollowupPlan => {
  if (earlyDecision) {
    if (earlyDecision.type === "followup") {
      return {
        type: earlyDecision.followupType,
        minutes: earlyDecision.followupDelay,
      };
    }
    return {
      type:
        earlyDecision.intervention === "consume_glucose"
          ? "recheck"
          : "drink_cornstarch",
      minutes: earlyDecision.intervention === "consume_glucose" ? 10 : 30,
    };
  }
  return {
    type: plan.nexFollowup.type,
    minutes: plan.nexFollowup.delayMinutes,
  };
};

export const isTargetInWindow = (
  targetMinutes: number,
  startMinutes: number,
  endMinutes: number,
) => {
  if (startMinutes <= endMinutes) {
    // normal case
    return targetMinutes >= startMinutes && targetMinutes <= endMinutes;
  } else {
    // crosses midnight
    return targetMinutes >= startMinutes || targetMinutes <= endMinutes;
  }
};

const findThresholdOfReading = (
  reading: ReadingInsert,
  thresholdRules: ThresholdRuleRow[],
): ThresholdRuleRow | null => {
  const targetValue = reading.glucoseValue;
  if (!targetValue) return null;

  const threshold = thresholdRules.find((curr) => {
    const minValue = curr.minValue;
    const maxValue = curr.maxValue;

    if (!maxValue && !minValue) return false;

    if (!maxValue) {
      return minValue && targetValue >= minValue;
    }

    if (!minValue) {
      return maxValue && targetValue <= maxValue;
    }

    return targetValue >= minValue && targetValue <= maxValue;
  });

  return threshold ?? null;
};

export const evaluateReading = (
  reading: ReadingInsert,
  thresholdRules: ThresholdRuleRow[],
  personalSettings: PatientSettingsRow,
): ReadingPlan => {
  const relevantThreshold = findThresholdOfReading(reading, thresholdRules);

  if (!relevantThreshold || !relevantThreshold.actions?.length)
    return {
      immediateIntervention: null,
      matchedRuleId: "none",
      nexFollowup: {
        delayMinutes: personalSettings.followupSpacingMinutes,
        type: "drink_cornstarch",
      },
    };

  const relevantAction = relevantThreshold.actions[0];

  return {
    immediateIntervention:
      relevantAction.type === "intervention"
        ? relevantAction.intervention
        : null,
    matchedRuleId: relevantThreshold.id,
    nexFollowup: {
      type:
        relevantAction.type === "followup"
          ? relevantAction.followupType
          : relevantAction.intervention === "consume_glucose"
            ? "recheck"
            : "drink_cornstarch",
      delayMinutes:
        relevantAction.type === "followup"
          ? relevantAction.followupDelay
          : relevantAction.intervention === "consume_glucose"
            ? 10
            : 30,
    },
  };
};

export const convertReadingPlanToReadingAction = (
  readingPlan: ReadingPlan,
): Action | null => {
  if (readingPlan.immediateIntervention) {
    return {
      type: "intervention",
      intervention: readingPlan.immediateIntervention,
    };
  }
  return {
    type: "followup",
    followupType: readingPlan.nexFollowup.type,
    followupDelay: readingPlan.nexFollowup.delayMinutes,
  };
};

export const createPlanAndSaveReading = async (
  reading: ReadingInsert,
  personalSettings: PatientSettingsRow,
  earlyDecision?: DecisionType,
): Promise<
  | { isSuccessful: true; plan: FollowupPlan }
  | { isSuccessful: false; error: string }
> => {
  if (!reading.patientId) {
    return { isSuccessful: false, error: "reading doesn't have patient id" };
  }

  const relatedThresholds = await listThresholdRulesByPatient(
    reading.patientId,
  );

  const newReading: ReadingInsert = {
    ...reading,
    recordedAt: new Date().toISOString(),
  };

  const readingPlan = evaluateReading(
    newReading,
    relatedThresholds,
    personalSettings,
  );

  const convertedReadingAction = convertReadingPlanToReadingAction(readingPlan);

  newReading.outcome =
    readingPlan.nexFollowup.type === "recheck" ? "recheck" : "cornstarch";

  newReading.evaluatedDecision = convertedReadingAction || null;
  newReading.finalDecision = earlyDecision || convertedReadingAction || null;
  newReading.wasOverridden =
    !!earlyDecision && !equal(earlyDecision, convertedReadingAction);
  try {
    await upsertReading(newReading);
  } catch (error) {
    return { isSuccessful: false, error: getErrorMessage(error) };
  }

  return {
    isSuccessful: true,
    plan: resolveNextFollowupPlan(readingPlan, earlyDecision),
  };
};

export const getPlanFromExistingReading = async (
  readingRow: ReadingRow,
  patientId: string,
  personalSettings: PatientSettingsRow,
  earlyDecision?: DecisionType,
): Promise<FollowupPlan> => {
  const relatedThresholds = await listThresholdRulesByPatient(patientId);

  const readingPlan = evaluateReading(
    readingRow,
    relatedThresholds,
    personalSettings,
  );

  return resolveNextFollowupPlan(readingPlan, earlyDecision);
};

export const createAndSaveFollowup = async (
  newFollowupId: string,
  followupPlan: FollowupPlan,
  reading: ReadingRow,
): Promise<{ isSuccessful: true } | { isSuccessful: false; error: string }> => {
  const followupDate = addMinutes(new Date(), followupPlan.minutes);

  const newFollowup: FollowupInsert = {
    id: newFollowupId,
    createdAt: new Date().toISOString(),
    dueAt: followupDate.toISOString(),
    patientId: reading.patientId,
    readingId: reading.id,
    scheduledNotificationIds: [],
    type: followupPlan.type,
    updatedAt: new Date().toISOString(),
    status: "pending",
  };

  try {
    await upsertFollowup(newFollowup);
    return { isSuccessful: true };
  } catch (error) {
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const handlePrevFollowupCompletion = async (
  sourceFollowUpId: string,
  readingRow: ReadingRow,
): Promise<{ isSuccessful: true } | { isSuccessful: false; error: string }> => {
  try {
    await completeFollowup(
      sourceFollowUpId,
      new Date().toISOString(),
      readingRow.cornstarchPhotoUrl || readingRow.meterPhotoUrl || undefined,
    );
    await cancelNotificationsOfFollowup(sourceFollowUpId);
    return { isSuccessful: true };
  } catch (error) {
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const createNewFollowupNotifications = async (
  reading: ReadingRow,
  followup: FollowupRow,
  personalSettings: PatientSettingsRow,
): Promise<
  | { isSuccessful: true; notificationIds: string[] }
  | { isSuccessful: false; error: string }
> => {
  if (!followup.dueAt) {
    return { isSuccessful: false, error: "followup doesn't have a due date" };
  }

  try {
    const res = await scheduleNextNotifications(
      reading,
      followup,
      new Date(followup.dueAt),
      personalSettings,
    );
    const notificationIds: string[] = [];
    res.forEach((settledResult) => {
      if (settledResult.status === "fulfilled") {
        notificationIds.push(settledResult.value);
      }
    });
    return { isSuccessful: true, notificationIds };
  } catch (error) {
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const shouldFollowupHaveNotifications = (followup: FollowupRow): boolean =>
  !!(
    followup.patientId &&
    followup.readingId &&
    !followup.completedAt &&
    followup.dueAt &&
    new Date(followup.dueAt) > new Date()
  );

export const addNotificationsToFollowup = async (
  followup: FollowupRow,
  notificationIds: string[],
): Promise<{ isSuccessful: true } | { isSuccessful: false, error: string }> => {
  try {
    await upsertFollowup({
      ...followup,
      scheduledNotificationIds: notificationIds,
    });
    return { isSuccessful: true };
  } catch (error) {
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};
