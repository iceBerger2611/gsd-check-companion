import { db } from "@/db/client";
import { careLinks } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CareLinkRow = typeof careLinks.$inferSelect;
export type CareLinkInsert = typeof careLinks.$inferInsert;

export const getCarelinkById = async (
  id: string,
): Promise<CareLinkRow | null> => {
  const results = await db
    .select()
    .from(careLinks)
    .where(eq(careLinks.id, id))
    .limit(1);
  return results[0] ?? null;
};

export const listPatientCareLinks = async (
  patientId: string,
): Promise<CareLinkRow[]> => {
  return db.select().from(careLinks).where(eq(careLinks.patientId, patientId));
};

export const listSupervisorCareLinks = async (
  supervisorId: string,
): Promise<CareLinkRow[]> => {
  return db
    .select()
    .from(careLinks)
    .where(eq(careLinks.supervisorId, supervisorId));
};

export const upsertCareLink = async (
  careLink: CareLinkInsert,
): Promise<void> => {
  await db
    .insert(careLinks)
    .values(careLink)
    .onConflictDoUpdate({ target: careLinks.id, set: careLink });
};
