import { db } from "@/src/db/client";
import { mapDbError, NotFoundError } from "@/src/db/errors";
import { thresholdRules } from "@/src/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import {
  buildPendingCreateFields,
  buildPendingUpdateFields,
  nowIso,
} from "../utils";

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

export const getThresholdRuleByIdSafe = async (
  id: string,
): Promise<ThresholdRuleRow | null> => {
  try {
    const result = await getThresholdRuleById(id);
    return result;
  } catch (error) {
    console.log(mapDbError(error, "falied to get threshold rule"));
    return null;
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

export const listPendingThresholdRules = async (): Promise<
  ThresholdRuleRow[]
> => {
  try {
    const results = await db
      .select()
      .from(thresholdRules)
      .where(inArray(thresholdRules.syncStatus, ["pending", "failed"]));
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
      .values({ ...threshold, ...buildPendingCreateFields() })
      .onConflictDoUpdate({
        target: thresholdRules.id,
        set: { ...threshold, ...buildPendingUpdateFields() },
      });
  } catch (error) {
    console.log(error);
    throw mapDbError(error, "failed to upsert threshold");
  }
};

export const upsertThresholdRuleFromRemote = async (
  thresholdRule: ThresholdRuleInsert,
): Promise<void> => {
  try {
    await db
      .insert(thresholdRules)
      .values(thresholdRule)
      .onConflictDoUpdate({
        target: thresholdRules.id,
        set: {
          ...thresholdRule,
          syncStatus: "synced",
          lastSyncedAt: thresholdRule.lastSyncedAt,
          syncError: null,
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert threshold rule from remote");
  }
};

export const markThresholdRuleSynced = async (id: string): Promise<void> => {
  try {
    await db
      .update(thresholdRules)
      .set({ syncStatus: "synced", lastSyncedAt: nowIso(), syncError: null })
      .where(eq(thresholdRules.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update threshold rule");
  }
};

export const markThresholdRuleFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  try {
    await db
      .update(thresholdRules)
      .set({ syncStatus: "failed", syncError: error })
      .where(eq(thresholdRules.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update threshold rule");
  }
};
