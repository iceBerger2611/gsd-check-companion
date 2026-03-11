import { db } from "@/db/client";
import { mapDbError, NotFoundError } from "@/db/errors";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;

export const getProfileById = async (
  id: string,
): Promise<ProfileRow> => {
  try {
    const results = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Profile ${id} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "falied to get profile");
  }
};

export const upsertProfile = async (profile: ProfileInsert): Promise<void> => {
  try {
    await db
      .insert(profiles)
      .values(profile)
      .onConflictDoUpdate({ target: profiles.id, set: profile });
  } catch (error) {
    throw mapDbError(error, "falied to upsert profile");
  }
};

export const updateProfileRole = async (
  id: string,
  role: ProfileRow["role"],
): Promise<void> => {
  try {
    await db.update(profiles).set({ role }).where(eq(profiles.id, id));
  } catch (error) {
    throw mapDbError(error, "falied to update profile");
  }
};

export const updateProfileName = async (
  id: string,
  name: string,
): Promise<void> => {
  try {
    await db
      .update(profiles)
      .set({ displayName: name })
      .where(eq(profiles.id, id));
  } catch (error) {
    throw mapDbError(error, "falied to update profile name");
  }
};
