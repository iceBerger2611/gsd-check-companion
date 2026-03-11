import { AppError } from "@/db/errors";
import { Action, DecisionType } from "@/db/schema";
import { dumpDbReadings } from "@/db/utils";
import { ReadingInsert, upsertReading } from "@/repos/readings.repo";
import {
  listThresholdRulesByPatient,
  ThresholdRuleRow,
} from "@/repos/thresholdRules";
import { reseedLocalThresholdRules } from "./ex";

export type ReadingDecision = {
  matchedRuleId: string;
  actions: Action[];
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
): ReadingDecision | null => {
  const relevantThreshold = findThresholdOfReading(reading, thresholdRules);

  return relevantThreshold?.actions
    ? {
        actions: relevantThreshold.actions,
        matchedRuleId: relevantThreshold.id,
      }
    : null;
};

export const processReading = async (
  reading: ReadingInsert,
  earlyDecision?: DecisionType,
) => {
  await reseedLocalThresholdRules("31a4df17-b061-4fbd-898e-cd9f7ef2f64f");
  if (!reading.patientId) return;

  const relatedThresholds = await listThresholdRulesByPatient(
    reading.patientId,
  );

  const newReading: ReadingInsert = {
    ...reading,
    recordedAt: Date().toString()
  };

  const decision = evaluateReading(newReading, relatedThresholds);
  const relevantAction = decision?.actions[0];

  newReading.evaluatedDecision = relevantAction || null;
  newReading.finalDecision = earlyDecision || relevantAction || null;
  newReading.wasOverridden = !!earlyDecision;
  try {
    await upsertReading(newReading);
    await dumpDbReadings();
    // create notifications and followups
  } catch (error) {
    return error as AppError;
  }
};
