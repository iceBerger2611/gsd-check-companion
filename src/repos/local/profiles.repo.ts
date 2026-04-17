import { db } from "@/src/db/client";
import { mapDbError, NotFoundError } from "@/src/db/errors";
import { profiles } from "@/src/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  buildPendingCreateFields,
  buildPendingUpdateFields,
  nowIso,
} from "../utils";

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;

export const getProfileById = async (id: string): Promise<ProfileRow> => {
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

export const getProfileByIdSafe = async (
  id: string,
): Promise<ProfileRow | null> => {
  try {
    const result = await getProfileById(id);
    return result;
  } catch (error) {
    console.log(mapDbError(error, "falied to get profile"));
    return null;
  }
};

export const listPendingProfiles = async (): Promise<ProfileRow[]> => {
  try {
    const results = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.syncStatus, ["pending", "failed"]));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get profiles");
  }
};

export const upsertProfile = async (profile: ProfileInsert): Promise<void> => {
  try {
    await db
      .insert(profiles)
      .values({ ...profile, ...buildPendingCreateFields() })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { ...profile, ...buildPendingUpdateFields() },
      });
  } catch (error) {
    throw mapDbError(error, "falied to upsert profile");
  }
};

export const upsertProfileFromRemote = async (
  profile: ProfileInsert,
): Promise<void> => {
  try {
    await db
      .insert(profiles)
      .values(profile)
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          ...profile,
          syncStatus: "synced",
          lastSyncedAt: profile.lastSyncedAt,
          syncError: null,
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert profile from remote");
  }
};

export const updateProfileRole = async (
  id: string,
  role: ProfileRow["role"],
): Promise<void> => {
  try {
    await db
      .update(profiles)
      .set({ role, ...buildPendingUpdateFields() })
      .where(eq(profiles.id, id));
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
      .set({ displayName: name, ...buildPendingUpdateFields() })
      .where(eq(profiles.id, id));
  } catch (error) {
    throw mapDbError(error, "falied to update profile name");
  }
};

export const markProfileSynced = async (id: string): Promise<void> => {
  try {
    await db
      .update(profiles)
      .set({ syncStatus: "synced", lastSyncedAt: nowIso(), syncError: null })
      .where(eq(profiles.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update profile");
  }
};

export const markProfileFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  try {
    await db
      .update(profiles)
      .set({ syncStatus: "failed", syncError: error })
      .where(eq(profiles.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update profile");
  }
};
