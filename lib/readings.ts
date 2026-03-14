import { AppError } from "@/db/errors";
import { Action, DecisionType, FollowupType, Intervention } from "@/db/schema";
import { dumpDbState } from "@/db/utils";
import { scheduleNextNotifications } from "@/notifications/scheduler";
import {
  completeFollowup,
  FollowupInsert,
  getFollowupById,
  upsertFollowup,
} from "@/repos/followups.repo";
import {
  getReadingById,
  ReadingInsert,
  upsertReading,
} from "@/repos/readings.repo";
import {
  listThresholdRulesByPatient,
  ThresholdRuleRow,
} from "@/repos/thresholdRules";
import { addMinutes } from "date-fns";
import * as Crypto from "expo-crypto";
import { reseedLocalThresholdRules } from "./ex";
import { resolveNextFollowupPlan } from "./utils";
import equal from 'fast-deep-equal'

export type ReadingPlan = {
  matchedRuleId: string;
  immediateIntervention: Intervention | null;
  nexFollowup: {
    type: FollowupType;
    delayMinutes: number;
  };
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
): ReadingPlan => {
  const relevantThreshold = findThresholdOfReading(reading, thresholdRules);

  if (!relevantThreshold || !relevantThreshold.actions?.length)
    return {
      immediateIntervention: null,
      matchedRuleId: "none",
      nexFollowup: {
        delayMinutes: 180,
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

export const processReading = async (
  reading: ReadingInsert,
  earlyDecision?: DecisionType,
  sourceFollowUpId?: string
) => {
  await reseedLocalThresholdRules("31a4df17-b061-4fbd-898e-cd9f7ef2f64f");
  if (!reading.patientId) return;

  const relatedThresholds = await listThresholdRulesByPatient(
    reading.patientId,
  );

  const newReading: ReadingInsert = {
    ...reading,
    recordedAt: Date().toString(),
  };

  const readingPlan = evaluateReading(newReading, relatedThresholds);

  const convertedReadingAction = convertReadingPlanToReadingAction(readingPlan);

  newReading.evaluatedDecision = convertedReadingAction || null;
  newReading.finalDecision = earlyDecision || convertedReadingAction || null;
  newReading.wasOverridden = !!earlyDecision && !equal(earlyDecision, convertedReadingAction);

  const nextFollowupPlan = resolveNextFollowupPlan(readingPlan, earlyDecision);

  const followupDate = addMinutes(new Date(), nextFollowupPlan.minutes);

  const newFollowup: FollowupInsert = {
    id: Crypto.randomUUID(),
    createdAt: new Date().toString(),
    dueAt: followupDate.toString(),
    patientId: reading.patientId,
    readingId: reading.id,
    scheduledNotificationIds: [],
    type: nextFollowupPlan.type,
    updatedAt: new Date().toString(),
  };

  try {
    await upsertReading(newReading);
    await upsertFollowup(newFollowup);
    const addedReadingRow = await getReadingById(newReading.id);
    const addedFollowupRow = await getFollowupById(newFollowup.id);
    if (sourceFollowUpId) {
      await completeFollowup(sourceFollowUpId, (new Date().toString()))
    }
    const res = await scheduleNextNotifications(
      addedReadingRow,
      addedFollowupRow,
      followupDate,
    );
    const notificationIds: string[] = [];
    res.forEach((settledResult) => {
      if (settledResult.status === "fulfilled") {
        notificationIds.push(settledResult.value);
      }
    });
    await upsertFollowup({
      ...addedFollowupRow,
      scheduledNotificationIds: notificationIds,
    });
    await dumpDbState();
    return { addedReadingRow, addedFollowupRow };
    // create notifications and followups
  } catch (error) {
    return error as AppError;
  }
};
