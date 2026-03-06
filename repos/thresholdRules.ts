import { db } from "@/db/client";
import { thresholdRules } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type ThresholdRuleRow = typeof thresholdRules.$inferSelect;
export type ThresholdRuleInsert = typeof thresholdRules.$inferInsert;

export const getThresholdRuleById = async (
  id: string,
): Promise<ThresholdRuleRow | null> => {
  const results = await db
    .select()
    .from(thresholdRules)
    .where(eq(thresholdRules.id, id))
    .limit(1);
  return results[0] ?? null;
};

export const listThresholdRulesByPatient = async (
  patientId: string,
): Promise<ThresholdRuleRow[]> => {
  return db
    .select()
    .from(thresholdRules)
    .where(eq(thresholdRules.patientId, patientId))
    .orderBy(desc(thresholdRules.createdAt));
};