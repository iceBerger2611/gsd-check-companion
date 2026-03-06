import { Action } from "@/db/schema";
import { ReadingInsert, ReadingRow, upsertReading } from "@/repos/readings.repo";
import { listThresholdRulesByPatient, ThresholdRuleRow } from "@/repos/thresholdRules";

type ReadingDecision = {
  matchedRuleId: string;
  actions: Action[];
};

const findThresholdOfReading = (
  reading: ReadingRow,
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

const evaluateReading = (
  reading: ReadingRow,
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

export const processReading = async (reading: ReadingInsert) => {
  if (!reading.patientId) return

  const relatedThresholds = await listThresholdRulesByPatient(reading.patientId)

  const readingRow: ReadingRow = {
    id: reading.id,
    cornstarchPhotoUrl: reading.cornstarchPhotoUrl ?? null,
    createdAt: reading.createdAt ?? null,
    glucoseValue: reading.glucoseValue ?? null,
    meterPhotoUrl: reading.meterPhotoUrl ?? null,
    note: reading.note ?? null,
    outcome: reading.outcome ?? null,
    patientId: reading.patientId ?? null,
    recordedAt: reading.recordedAt ?? null,
    unit: reading.unit ?? null
  } 

  const decision = evaluateReading(readingRow, relatedThresholds)
  
  if (decision) {
    await upsertReading(reading)
    // create notifications and followups
  }
}
