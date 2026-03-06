import { db } from "@/db/client";
import { readings } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export type ReadingRow = typeof readings.$inferSelect;
export type ReadingInsert = typeof readings.$inferInsert;

export const getReadingById = async (
  id: string,
): Promise<ReadingRow | null> => {
  const results = await db
    .select()
    .from(readings)
    .where(eq(readings.id, id))
    .limit(1);
  return results[0] ?? null;
};

export const listReadingsByPatient = async (
  patientId: string,
): Promise<ReadingRow[]> => {
  return db
    .select()
    .from(readings)
    .where(eq(readings.patientId, patientId))
    .orderBy(desc(readings.recordedAt));
};

export const getLatestReading = async (
  patientId: string,
): Promise<ReadingRow | null> => {
  const results = await db
    .select()
    .from(readings)
    .where(eq(readings.patientId, patientId))
    .orderBy(desc(readings.recordedAt))
    .limit(1);
  return results[0] ?? null;
};

export const getReadingsBetween = async (
  patientId: string,
  start: string,
  end: string,
): Promise<ReadingRow[]> => {
  return db
    .select()
    .from(readings)
    .where(
      and(
        eq(readings.patientId, patientId),
        gte(readings.recordedAt, start),
        lte(readings.recordedAt, end),
      ),
    )
    .orderBy(desc(readings.recordedAt));
};

export const upsertReading = async (reading: ReadingInsert): Promise<void> => {
  await db
    .insert(readings)
    .values(reading)
    .onConflictDoUpdate({ target: readings.id, set: reading });
};

export const updateReadingOutcome = async (
  id: string,
  outcome: ReadingRow["outcome"],
): Promise<void> => {
  await db.update(readings).set({ outcome }).where(eq(readings.id, id));
};
