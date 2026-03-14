import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { thresholdRules } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type ThresholdRuleRow = typeof thresholdRules.$inferSelect;
export type ThresholdRuleInsert = typeof thresholdRules.$inferInsert;

export const getThresholdRuleById = async (
  id: string,
): Promise<ThresholdRuleRow> => {
  try {
    const results = await db
      .select()
      .from(thresholdRules)
      .where(eq(thresholdRules.id, id))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Threshold rule ${id} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get threshold rule");
  }
};

export const listThresholdRulesByPatient = async (
  patientId: string,
): Promise<ThresholdRuleRow[]> => {
  try {
    const results = await db
      .select()
      .from(thresholdRules)
      .where(eq(thresholdRules.patientId, patientId))
      .orderBy(desc(thresholdRules.createdAt));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get threshold rules");
  }
};

export const upsertThreshold = async (
  threshold: ThresholdRuleInsert,
): Promise<void> => {
  try {
    await db
      .insert(thresholdRules)
      .values(threshold)
      .onConflictDoUpdate({ target: thresholdRules.id, set: threshold });
  } catch (error) {
    console.log(error);
    throw mapDbError(error, "failed to upsert threshold");
  }
};
