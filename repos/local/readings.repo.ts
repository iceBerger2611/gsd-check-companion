import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { readings } from "@/db/schema";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import {
  buildPendingCreateFields,
  buildPendingUpdateFields,
  nowIso,
} from "../utils";

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

export const getReadingByIdSafe = async (
  id: string,
): Promise<ReadingRow | null> => {
  try {
    const result = await getReadingById(id);
    return result;
  } catch (error) {
    console.log(mapDbError(error, "falied to get reading"));
    return null;
  }
};

export const listReadingsByPatient = async (
  patientId: string,
  limit?: number
): Promise<ReadingRow[]> => {
  try {
    let query = db
      .select()
      .from(readings)
      .where(eq(readings.patientId, patientId))
      .orderBy(desc(readings.recordedAt))
      .$dynamic()
      
      if (limit) {
        query = query.limit(5)
      }
      const results = await query
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get readings");
  }
};

export const listPendingReadings = async (): Promise<ReadingRow[]> => {
  try {
    const results = await db
      .select()
      .from(readings)
      .where(inArray(readings.syncStatus, ["pending", "failed"]));
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
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get readings");
  }
};

export const upsertReading = async (reading: ReadingInsert): Promise<void> => {
  try {
    await db
      .insert(readings)
      .values({ ...reading, ...buildPendingCreateFields() })
      .onConflictDoUpdate({
        target: readings.id,
        set: { ...reading, ...buildPendingUpdateFields() },
      });
  } catch (error) {
    console.log(error);
    throw mapDbError(error, "failed to upsert reading");
  }
};

export const upsertReadingFromRemote = async (
  reading: ReadingInsert,
): Promise<void> => {
  try {
    await db
      .insert(readings)
      .values(reading)
      .onConflictDoUpdate({
        target: readings.id,
        set: {
          ...reading,
          syncStatus: "synced",
          lastSyncedAt: reading.lastSyncedAt,
          syncError: null,
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert reading from remote");
  }
};

export const updateReadingOutcome = async (
  id: string,
  outcome: ReadingRow["outcome"],
): Promise<void> => {
  try {
    await db
      .update(readings)
      .set({ outcome, ...buildPendingUpdateFields() })
      .where(eq(readings.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update reading outcome");
  }
};

export const markReadingSynced = async (id: string): Promise<void> => {
  try {
    await db
      .update(readings)
      .set({ syncStatus: "synced", lastSyncedAt: nowIso(), syncError: null })
      .where(eq(readings.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update reading");
  }
};

export const markReadingFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  try {
    await db
      .update(readings)
      .set({ syncStatus: "failed", syncError: error })
      .where(eq(readings.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update reading");
  }
};
