import { db } from "@/src/db/client";
import { mapDbError, NotFoundError } from "@/src/db/errors";
import { followups } from "@/src/db/schema";
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import {
  buildPendingCreateFields,
  buildPendingUpdateFields,
  nowIso,
} from "../utils";

export type FollowupRow = typeof followups.$inferSelect;
export type FollowupInsert = typeof followups.$inferInsert;

export const getFollowupById = async (id: string): Promise<FollowupRow> => {
  try {
    const results = await db
      .select()
      .from(followups)
      .where(eq(followups.id, id))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Followup ${id} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get followup");
  }
};

export const getFollowupByIdSafe = async (
  id: string,
): Promise<FollowupRow | null> => {
  try {
    const result = await getFollowupById(id);
    return result;
  } catch (error) {
    console.log(mapDbError(error, "falied to get followup"));
    return null;
  }
};

export const listFollowupsByPatient = async (
  patientId: string,
): Promise<FollowupRow[]> => {
  try {
    const results = await db
      .select()
      .from(followups)
      .where(eq(followups.patientId, patientId))
      .orderBy(desc(followups.dueAt));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get followups");
  }
};

export const listPendingFollowups = async (): Promise<FollowupRow[]> => {
  try {
    const results = await db
      .select()
      .from(followups)
      .where(inArray(followups.syncStatus, ["pending", "failed"]));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get followups");
  }
};

export const getNextPendingFollowup = async (
  patientId: string,
): Promise<FollowupRow> => {
  try {
    const results = await db
      .select()
      .from(followups)
      .where(
        and(
          eq(followups.patientId, patientId),
          eq(followups.status, "pending"),
        ),
      )
      .orderBy(asc(followups.dueAt))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Followup of patient ${patientId} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get followup");
  }
};

export const getNextPendingFollowupDueBefore = async (
  patientId: string,
  nowIso: string,
): Promise<FollowupRow> => {
  try {
    const results = await db
      .select()
      .from(followups)
      .where(
        and(
          eq(followups.patientId, patientId),
          lte(followups.dueAt, nowIso),
          eq(followups.status, "pending"),
        ),
      )
      .orderBy(asc(followups.dueAt))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Followup of patient ${patientId} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get followup");
  }
};

export const upsertFollowup = async (
  followup: FollowupInsert,
): Promise<void> => {
  try {
    await db
      .insert(followups)
      .values({ ...followup, ...buildPendingCreateFields() })
      .onConflictDoUpdate({
        target: followups.id,
        set: { ...followup, ...buildPendingUpdateFields() },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert followup");
  }
};

export const upsertFollowupFromRemote = async (
  followup: FollowupInsert,
): Promise<void> => {
  try {
    await db
      .insert(followups)
      .values(followup)
      .onConflictDoUpdate({
        target: followups.id,
        set: {
          ...followup,
          syncStatus: "synced",
          lastSyncedAt: followup.lastSyncedAt,
          syncError: null,
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert followup from remote");
  }
};

export const completeFollowup = async (
  id: string,
  completedAtIso: string,
  photoUrl?: string,
  photoPath?: string,
): Promise<void> => {
  try {
    await db
      .update(followups)
      .set({
        completedAt: completedAtIso,
        photoUrl,
        photoPath,
        status: "completed",
        ...buildPendingUpdateFields(),
      })
      .where(eq(followups.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to complete followup");
  }
};

export const markFollowupSynced = async (id: string): Promise<void> => {
  try {
    await db
      .update(followups)
      .set({ syncStatus: "synced", lastSyncedAt: nowIso(), syncError: null })
      .where(eq(followups.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update followup");
  }
};

export const markFollowupFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  try {
    await db
      .update(followups)
      .set({ syncStatus: "failed", syncError: error })
      .where(eq(followups.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update followup");
  }
};
