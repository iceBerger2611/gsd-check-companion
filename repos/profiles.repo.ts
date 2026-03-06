import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;

export const getProfileById = async (
  id: string,
): Promise<ProfileRow | null> => {
  const results = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  return results[0] ?? null;
};

export const upsertProfile = async (profile: ProfileInsert): Promise<void> => {
  await db
    .insert(profiles)
    .values(profile)
    .onConflictDoUpdate({ target: profiles.id, set: profile });
};

export const updateProfileRole = async (
  id: string,
  role: ProfileRow["role"],
): Promise<void> => {
  await db.update(profiles).set({ role }).where(eq(profiles.id, id));
};

export const updateProfileName = async (
  id: string,
  name: string,
): Promise<void> => {
  await db
    .update(profiles)
    .set({ displayName: name })
    .where(eq(profiles.id, id));
};
