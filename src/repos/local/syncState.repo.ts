import { db } from "@/db/client";
import { mapDbError } from "@/db/errors";
import { syncState } from "@/db/schema";
import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { nowIso } from "../utils";

export type SyncStateRow = InferSelectModel<typeof syncState>;
export type SyncStateInsert = InferInsertModel<typeof syncState>;

export const getSyncCursor = async (key: string): Promise<string | null> => {
  try {
    const results = await db
      .select()
      .from(syncState)
      .where(eq(syncState.key, key))
      .limit(1);

    return results[0]?.value ?? null;
  } catch (error) {
    throw mapDbError(error, "failed to get sync cursor");
  }
};

export const setSyncCursor = async (
  key: string,
  value: string | null,
): Promise<void> => {
  try {
    await db
      .insert(syncState)
      .values({
        key,
        value,
        updatedAt: nowIso(),
      })
      .onConflictDoUpdate({
        target: syncState.key,
        set: {
          value,
          updatedAt: nowIso(),
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to set sync cursor");
  }
};