import { db } from "@/db/client";
import { thresholdRules } from "@/db/schema";
import type { ThresholdRuleInsert } from "@/repos/thresholdRules";
import { eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";

const localThresholdRules: ThresholdRuleInsert[] = [
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "above average range",
    classification: "normal",
    minValue: 80,
    maxValue: 99,
    actions: [{ type: "followup", followupType: "recheck", followupDelay: 30 }],
  },
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "high range",
    classification: "normal",
    minValue: 100,
    maxValue: 115,
    actions: [{ type: "followup", followupType: "recheck", followupDelay: 40 }],
  },
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "suspiciously high range",
    classification: "normal",
    minValue: 116,
    maxValue: null,
    actions: [{ type: "followup", followupType: "recheck", followupDelay: 0 }],
  },
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "average range",
    classification: "normal",
    minValue: 70,
    maxValue: 79,
    actions: [{ type: "followup", followupType: "recheck", followupDelay: 15 }],
  },
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "low range",
    classification: "high",
    minValue: 60,
    maxValue: 69,
    actions: [{ type: "intervention", intervention: "eat_immediately" }],
  },
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "very low range",
    classification: "high",
    minValue: 40,
    maxValue: 59,
    actions: [{ type: "intervention", intervention: "consume_glucose" }],
  },
  {
    id: "",
    patientId: "31a4df17-b061-4fbd-898e-cd9f7ef2f64f",
    label: "severe hypoglycemia",
    classification: "critical",
    minValue: null,
    maxValue: 39,
    actions: [{ type: "intervention", intervention: "consume_glucose" }],
  },
];

export async function reseedLocalThresholdRules(patientId: string) {
  // Keep only rules for this patient
  const rulesForPatient = localThresholdRules
    .filter((rule) => rule.patientId === patientId)
    .map(({ id, ...rule }) => ({
      ...rule,
      id: Crypto.randomUUID(),
      minValue: rule.minValue ?? null,
      maxValue: rule.maxValue ?? null,
    }));

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(thresholdRules)
        .where(eq(thresholdRules.patientId, patientId));

      if (rulesForPatient.length > 0) {
        await tx.insert(thresholdRules).values(rulesForPatient);
      }
    });

    const inserted = await db
      .select()
      .from(thresholdRules)
      .where(eq(thresholdRules.patientId, patientId));

    console.log("[reseedLocalThresholdRules] inserted rules:", inserted.length);
    console.table(inserted);

    return inserted;
  } catch (error) {
    console.error("[reseedLocalThresholdRules] failed:", error);
    throw error;
  }
}
