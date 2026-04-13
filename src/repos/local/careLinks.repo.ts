import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { careLinks } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { nowIso } from "../utils";

export type CareLinkRow = typeof careLinks.$inferSelect;
export type CareLinkInsert = typeof careLinks.$inferInsert;

export const getCarelinkById = async (id: string): Promise<CareLinkRow> => {
  try {
    const results = await db
      .select()
      .from(careLinks)
      .where(eq(careLinks.id, id))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Care link ${id} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get care link");
  }
};

export const getCareLinkByIdSafe = async (
  id: string,
): Promise<CareLinkRow | null> => {
  try {
    const result = await getCarelinkById(id);
    return result;
  } catch (error) {
    console.log(mapDbError(error, "falied to get care link"));
    return null;
  }
};

export const listPatientCareLinks = async (
  patientId: string,
): Promise<CareLinkRow[]> => {
  try {
    const results = await db
      .select()
      .from(careLinks)
      .where(eq(careLinks.patientId, patientId));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get care links");
  }
};

export const listSupervisorCareLinks = async (
  supervisorId: string,
): Promise<CareLinkRow[]> => {
  try {
    const results = await db
      .select()
      .from(careLinks)
      .where(eq(careLinks.supervisorId, supervisorId));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get care links");
  }
};

export const listPendingCareLinks = async (): Promise<CareLinkRow[]> => {
  try {
    const results = await db
      .select()
      .from(careLinks)
      .where(inArray(careLinks.syncStatus, ["pending", "failed"]));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get care links");
  }
};

export const upsertCareLink = async (
  careLink: CareLinkInsert,
): Promise<void> => {
  try {
    await db
      .insert(careLinks)
      .values(careLink)
      .onConflictDoUpdate({ target: careLinks.id, set: careLink });
  } catch (error) {
    throw mapDbError(error, "failed to upsert care link");
  }
};

export const upsertCareLinkFromRemote = async (
  careLink: CareLinkInsert,
): Promise<void> => {
  try {
    await db
      .insert(careLinks)
      .values(careLink)
      .onConflictDoUpdate({
        target: careLinks.id,
        set: {
          ...careLink,
          syncStatus: "synced",
          lastSyncedAt: careLink.lastSyncedAt,
          syncError: null,
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert profile from remote");
  }
};

export const markCareLinkSynced = async (id: string): Promise<void> => {
  try {
    await db
      .update(careLinks)
      .set({ syncStatus: "synced", lastSyncedAt: nowIso(), syncError: null })
      .where(eq(careLinks.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update care link");
  }
};

export const markCareLinkFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  try {
    await db
      .update(careLinks)
      .set({ syncStatus: "failed", syncError: error })
      .where(eq(careLinks.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update care link");
  }
};
