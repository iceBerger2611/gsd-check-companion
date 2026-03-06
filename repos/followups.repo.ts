import { db } from "@/db/client";
import { followups } from "@/db/schema";
import { and, asc, desc, eq, lte } from "drizzle-orm";

export type FollowupRow = typeof followups.$inferSelect;
export type FollowupInsert = typeof followups.$inferInsert;

export const getFollowupById = async (
  id: string,
): Promise<FollowupRow | null> => {
  const results = await db
    .select()
    .from(followups)
    .where(eq(followups.id, id))
    .limit(1);
  return results[0] ?? null;
};

export const listFollowupsByPatient = async (
  patientId: string,
): Promise<FollowupRow[]> => {
  return db
    .select()
    .from(followups)
    .where(eq(followups.patientId, patientId))
    .orderBy(desc(followups.dueAt));
};

export const getNextPendingFollowup = async (
  patientId: string,
): Promise<FollowupRow | null> => {
  const results = await db
    .select()
    .from(followups)
    .where(
      and(eq(followups.patientId, patientId), eq(followups.status, "pending")),
    )
    .orderBy(asc(followups.dueAt))
    .limit(1);
  return results[0] ?? null;
};

export const getNextPendingFollowupDueBefore = async (
  patientId: string,
  nowIso: string,
): Promise<FollowupRow | null> => {
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
  return results[0] ?? null;
};

export const upsertFollowup = async (
  followup: FollowupInsert,
): Promise<void> => {
  await db
    .insert(followups)
    .values(followup)
    .onConflictDoUpdate({ target: followups.id, set: followup });
};

export const completeFollowup = async (
  id: string,
  completedAtIso: string,
  photoUrl?: string,
  photoPath?: string,
): Promise<void> => {
  await db
    .update(followups)
    .set({
      completedAt: completedAtIso,
      photoUrl,
      photoPath,
      status: "completed",
    })
    .where(eq(followups.id, id));
};
