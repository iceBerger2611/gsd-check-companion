import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { followups } from "@/db/schema";
import { and, asc, desc, eq, lte } from "drizzle-orm";

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

export const listFollowupsByPatient = async (
  patientId: string,
): Promise<FollowupRow[]> => {
  try {
    const results = await db
      .select()
      .from(followups)
      .where(eq(followups.patientId, patientId))
      .orderBy(desc(followups.dueAt));
    if (!results.length) {
      throw new NotFoundError(`Followup of patient ${patientId} not found`);
    }
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
      .values(followup)
      .onConflictDoUpdate({ target: followups.id, set: followup });
  } catch (error) {
    throw mapDbError(error, "failed to upsert followup");
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
      })
      .where(eq(followups.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to complete followup");
  }
};
