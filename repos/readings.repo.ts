import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { readings } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export type ReadingRow = typeof readings.$inferSelect;
export type ReadingInsert = typeof readings.$inferInsert;

export const getReadingById = async (id: string): Promise<ReadingRow> => {
  try {
    const results = await db
      .select()
      .from(readings)
      .where(eq(readings.id, id))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Reading ${id} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get reading");
  }
};

export const listReadingsByPatient = async (
  patientId: string,
): Promise<ReadingRow[]> => {
  try {
    const results = await db
      .select()
      .from(readings)
      .where(eq(readings.patientId, patientId))
      .orderBy(desc(readings.recordedAt));
    if (!results.length) {
      throw new NotFoundError(`Readings of patient ${patientId} not found`);
    }
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get readings");
  }
};

export const getLatestReading = async (
  patientId: string,
): Promise<ReadingRow> => {
  try {
    const results = await db
      .select()
      .from(readings)
      .where(eq(readings.patientId, patientId))
      .orderBy(desc(readings.recordedAt))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Reading of patient ${patientId} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get reading");
  }
};

export const getReadingsBetween = async (
  patientId: string,
  start: string,
  end: string,
): Promise<ReadingRow[]> => {
  try {
    const results = await db
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
    if (!results.length) {
      throw new NotFoundError(`Readings of patient ${patientId} not found`);
    }
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get readings");
  }
};

export const upsertReading = async (reading: ReadingInsert): Promise<void> => {
  try {
    await db
      .insert(readings)
      .values(reading)
      .onConflictDoUpdate({ target: readings.id, set: reading });
  } catch (error) {
    console.log(error);
    throw mapDbError(error, "failed to upsert reading");
  }
};

export const updateReadingOutcome = async (
  id: string,
  outcome: ReadingRow["outcome"],
): Promise<void> => {
  try {
    await db.update(readings).set({ outcome }).where(eq(readings.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update reading outcome");
  }
};
