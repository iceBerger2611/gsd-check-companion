import { db } from "@/src/db/client";
import { mapDbError, NotFoundError } from "@/src/db/errors";
import { patientSettings } from "@/src/db/schema";
import { eq, inArray } from "drizzle-orm";
import { buildPendingCreateFields, buildPendingUpdateFields, nowIso } from "../utils";

export type PatientSettingsRow = typeof patientSettings.$inferSelect;
export type PatientSettingsInsert = typeof patientSettings.$inferInsert;

export const getPatientSettingsById = async (id: string): Promise<PatientSettingsRow> => {
  try {
    const results = await db
      .select()
      .from(patientSettings)
      .where(eq(patientSettings.id, id))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Patient settings ${id} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get patient settings");
  }
};

export const getPatientSettingsByIdSafe = async (
  id: string,
): Promise<PatientSettingsRow | null> => {
  try {
    const result = await getPatientSettingsById(id);
    return result;
  } catch (error) {
    console.log(mapDbError(error, "falied to get patient settings"));
    return null;
  }
};

export const getPatientSettingsOfPatient = async (patientId: string): Promise<PatientSettingsRow> => {
  try {
    const results = await db
      .select()
      .from(patientSettings)
      .where(eq(patientSettings.patientId, patientId))
      .limit(1);
    if (!results[0]) {
      throw new NotFoundError(`Patient settings of patient ${patientId} not found`);
    }
    return results[0];
  } catch (error) {
    throw mapDbError(error, "failed to get patient settings of patient");
  }
}

export const listPendingPatientSettingss = async (): Promise<PatientSettingsRow[]> => {
  try {
    const results = await db
      .select()
      .from(patientSettings)
      .where(inArray(patientSettings.syncStatus, ["pending", "failed"]));
    return results;
  } catch (error) {
    throw mapDbError(error, "failed to get patient settings");
  }
};

export const upsertPatientSettings = async (patientSetting: PatientSettingsInsert): Promise<void> => {
  try {
    await db
      .insert(patientSettings)
      .values({ ...patientSetting, ...buildPendingCreateFields() })
      .onConflictDoUpdate({
        target: patientSettings.id,
        set: { ...patientSetting, ...buildPendingUpdateFields() },
      });
  } catch (error) {
    throw mapDbError(error, "falied to upsert patient setting");
  }
};

export const upsertPatientSettingsFromRemote = async (
  patientSetting: PatientSettingsInsert,
): Promise<void> => {
  try {
    await db
      .insert(patientSettings)
      .values(patientSetting)
      .onConflictDoUpdate({
        target: patientSettings.id,
        set: {
          ...patientSetting,
          syncStatus: "synced",
          lastSyncedAt: patientSetting.lastSyncedAt,
          syncError: null,
        },
      });
  } catch (error) {
    throw mapDbError(error, "failed to upsert patient setting from remote");
  }
};

export const markPatientSettingsSynced = async (id: string): Promise<void> => {
  try {
    await db
      .update(patientSettings)
      .set({ syncStatus: "synced", lastSyncedAt: nowIso(), syncError: null })
      .where(eq(patientSettings.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update patient setting");
  }
};

export const markPatientSettingsFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  try {
    await db
      .update(patientSettings)
      .set({ syncStatus: "failed", syncError: error })
      .where(eq(patientSettings.id, id));
  } catch (error) {
    throw mapDbError(error, "failed to update patient setting");
  }
};