import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { careLinks } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export const listPatientCareLinks = async (
  patientId: string,
): Promise<CareLinkRow[]> => {
  try {
    const results = await db
      .select()
      .from(careLinks)
      .where(eq(careLinks.patientId, patientId));
    if (!results.length) {
      throw new NotFoundError(`Care links of patient ${patientId} not found`);
    }
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
    if (!results.length) {
      throw new NotFoundError(
        `Care links of supervisor ${supervisorId} not found`,
      );
    }
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
