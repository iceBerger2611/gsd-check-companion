import {
  CareLinkInsert,
  CareLinkRow,
  getCareLinkByIdSafe,
  listPendingCareLinks,
  markCareLinkFailed,
  markCareLinkSynced,
  upsertCareLinkFromRemote,
} from "@/repos/local/careLinks.repo";
import {
  FollowupInsert,
  FollowupRow,
  getFollowupByIdSafe,
  listPendingFollowups,
  markFollowupFailed,
  markFollowupSynced,
  upsertFollowupFromRemote,
} from "@/repos/local/followups.repo";
import {
  getPatientSettingsByIdSafe,
  listPendingPatientSettingss,
  markPatientSettingsFailed,
  markPatientSettingsSynced,
  PatientSettingsInsert,
  PatientSettingsRow,
  upsertPatientSettingsFromRemote,
} from "@/repos/local/patientSettings.repo";
import {
  getProfileByIdSafe,
  listPendingProfiles,
  markProfileFailed,
  markProfileSynced,
  ProfileInsert,
  ProfileRow,
  upsertProfileFromRemote,
} from "@/repos/local/profiles.repo";
import {
  getReadingByIdSafe,
  listPendingReadings,
  markReadingFailed,
  markReadingSynced,
  ReadingInsert,
  ReadingRow,
  upsertReadingFromRemote,
} from "@/repos/local/readings.repo";
import { getSyncCursor, setSyncCursor } from "@/repos/local/syncState.repo";
import {
  getThresholdRuleByIdSafe,
  listPendingThresholdRules,
  markThresholdRuleFailed,
  markThresholdRuleSynced,
  ThresholdRuleInsert,
  ThresholdRuleRow,
  upsertThresholdRuleFromRemote,
} from "@/repos/local/thresholdRules.repo";
import {
  fetchRemoteCareLinksChangedSince,
  upsertRemoteCareLink,
} from "@/repos/remote/careLinks.remote";
import {
  fetchRemoteFollowupsChangedSince,
  upsertRemoteFollowup,
} from "@/repos/remote/followups.remote";
import {
  fetchRemotePatientSettingsChangedSince,
  upsertRemotePatientSettings,
} from "@/repos/remote/patientSettings.remote";
import {
  fetchRemoteProfilesChangedSince,
  upsertRemoteProfile,
} from "@/repos/remote/profiles.remote";
import {
  fetchRemoteReadingsChangedSince,
  upsertRemoteReading,
} from "@/repos/remote/readings.remote";
import {
  fetchRemoteThresholdRulesChangedSince,
  upsertRemoteThresholdRule,
} from "@/repos/remote/thresholdRules.remote";
import {
  getErrorMessage,
  mapLocalCareLinkToRemote,
  mapLocalFollowupToRemote,
  mapLocalPatientSettingsToRemote,
  mapLocalProfileToRemote,
  mapLocalReadingToRemote,
  mapLocalThresholdRuleToRemote,
  mapRemoteCareLinkToLocal,
  mapRemoteFollowupToLocal,
  mapRemotePatientSettingsToLocal,
  mapRemoteProfileToLocal,
  mapRemoteReadingToLocal,
  mapRemoteThresholdRuleToLocal,
  RemoteCareLinkUpsertPayload,
  RemoteFollowupUpsertPayload,
  RemotePatientSettingsUpsertPayload,
  RemoteProfileUpsertPayload,
  RemoteReadingUpsertPayload,
  RemoteThresholdRuleUpsertPayload,
} from "@/repos/utils";
import { Database } from "@/types/database.types";
import { SyncCursorKeys } from "./schema";

export type PushPendingResult = {
  attempted: number;
  succeeded: number;
  failed: number;
};

type PushPendingRowOptions<TLocalRow extends { id: string }, TRemoteRow> = {
  listPendingRows: () => Promise<TLocalRow[]>;
  mapLocalRowToRemote: (row: TLocalRow) => TRemoteRow;
  upsertRemoteRow: (row: TRemoteRow) => Promise<void>;
  markRowSynced: (id: string) => Promise<void>;
  markRowFailed: (id: string, error: string) => Promise<void>;
};

type PullRowsOptions<
  TLocalRow extends { syncStatus: string; updatedAt: string | null },
  TLocalRowInsert extends { id: string },
  TRemoteRow extends { id: string; updated_at: string },
> = {
  syncCursorKey: string;
  fetchRemoteRowsChangedSince: (
    lastPulledAt: string | null,
  ) => Promise<TRemoteRow[]>;
  getRowByIdSafe: (id: string) => Promise<TLocalRow | null>;
  upsertRowFromRemote: (row: TLocalRowInsert) => Promise<void>;
  mapRemoteRowToLocal: (row: TRemoteRow) => TLocalRowInsert;
};

export const pushPendingRows = async <
  TLocalRow extends { id: string },
  TRemoteRow,
>({
  listPendingRows,
  mapLocalRowToRemote,
  markRowFailed,
  markRowSynced,
  upsertRemoteRow,
}: PushPendingRowOptions<
  TLocalRow,
  TRemoteRow
>): Promise<PushPendingResult> => {
  const pendingRows = await listPendingRows();

  const result: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  for (const row of pendingRows) {
    result.attempted++;
    try {
      const payload = mapLocalRowToRemote(row);
      await upsertRemoteRow(payload);
      result.succeeded++;
      await markRowSynced(row.id);
    } catch (error) {
      result.failed++;
      await markRowFailed(row.id, getErrorMessage(error));
    }
  }

  return result;
};

export const pushPendingChanges = async (): Promise<PushPendingResult> => {
  const finalResult: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  const profileResults = await pushPendingRows<
    ProfileRow,
    RemoteProfileUpsertPayload
  >({
    listPendingRows: listPendingProfiles,
    mapLocalRowToRemote: mapLocalProfileToRemote,
    markRowFailed: markProfileFailed,
    markRowSynced: markProfileSynced,
    upsertRemoteRow: upsertRemoteProfile,
  });
  const careLinkResults = await pushPendingRows<
    CareLinkRow,
    RemoteCareLinkUpsertPayload
  >({
    listPendingRows: listPendingCareLinks,
    mapLocalRowToRemote: mapLocalCareLinkToRemote,
    markRowFailed: markCareLinkFailed,
    markRowSynced: markCareLinkSynced,
    upsertRemoteRow: upsertRemoteCareLink,
  });
  const patientSettingsResults = await pushPendingRows<
    PatientSettingsRow,
    RemotePatientSettingsUpsertPayload
  >({
    listPendingRows: listPendingPatientSettingss,
    mapLocalRowToRemote: mapLocalPatientSettingsToRemote,
    markRowFailed: markPatientSettingsFailed,
    markRowSynced: markPatientSettingsSynced,
    upsertRemoteRow: upsertRemotePatientSettings,
  });
  const thresholdRuleResults = await pushPendingRows<
    ThresholdRuleRow,
    RemoteThresholdRuleUpsertPayload
  >({
    listPendingRows: listPendingThresholdRules,
    mapLocalRowToRemote: mapLocalThresholdRuleToRemote,
    markRowFailed: markThresholdRuleFailed,
    markRowSynced: markThresholdRuleSynced,
    upsertRemoteRow: upsertRemoteThresholdRule,
  });
  const readingResults = await pushPendingRows<
    ReadingRow,
    RemoteReadingUpsertPayload
  >({
    listPendingRows: listPendingReadings,
    mapLocalRowToRemote: mapLocalReadingToRemote,
    markRowFailed: markReadingFailed,
    markRowSynced: markReadingSynced,
    upsertRemoteRow: upsertRemoteReading,
  });
  const followupResults = await pushPendingRows<
    FollowupRow,
    RemoteFollowupUpsertPayload
  >({
    listPendingRows: listPendingFollowups,
    mapLocalRowToRemote: mapLocalFollowupToRemote,
    markRowFailed: markFollowupFailed,
    markRowSynced: markFollowupSynced,
    upsertRemoteRow: upsertRemoteFollowup,
  });

  const results = [
    profileResults,
    careLinkResults,
    patientSettingsResults,
    thresholdRuleResults,
    readingResults,
    followupResults,
  ];

  results.forEach((result) => {
    finalResult.attempted += result.attempted;
    finalResult.succeeded += result.succeeded;
    finalResult.failed += result.failed;
  });

  return finalResult;
};

export const pullRows = async <
  TLocalRow extends { syncStatus: string; updatedAt: string | null },
  TLocalRowInsert extends { id: string },
  TRemoteRow extends { id: string; updated_at: string },
>({
  syncCursorKey,
  fetchRemoteRowsChangedSince,
  getRowByIdSafe,
  mapRemoteRowToLocal,
  upsertRowFromRemote,
}: PullRowsOptions<
  TLocalRow,
  TLocalRowInsert,
  TRemoteRow
>): Promise<number> => {
  const lastPulledAt = await getSyncCursor(syncCursorKey);
  const remoteRows = await fetchRemoteRowsChangedSince(lastPulledAt);

  let applied = 0;
  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    const localRow = await getRowByIdSafe(remoteRow.id);

    if (!localRow) {
      await upsertRowFromRemote(mapRemoteRowToLocal(remoteRow));
      applied++;

      if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remoteRow.updated_at;
      }
      continue;
    }

    if (localRow.syncStatus === "pending") {
      continue;
    }

    const localUpdatedAt = localRow.updatedAt ?? "";
    const remoteUpdatedAt = remoteRow.updated_at ?? "";

    if (remoteUpdatedAt > localUpdatedAt) {
      await upsertRowFromRemote(mapRemoteRowToLocal(remoteRow));
      applied++;
    }

    if (
      !maxUpdatedAt ||
      (remoteRow.updated_at && remoteRow.updated_at > maxUpdatedAt)
    ) {
      maxUpdatedAt = remoteRow.updated_at;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(syncCursorKey, maxUpdatedAt);
  }

  return applied;
};

export const pullChanges = async (): Promise<number> => {
  const profilesApplied = await pullRows<
    ProfileRow,
    ProfileInsert,
    Database["public"]["Tables"]["profiles"]["Row"]
  >({
    syncCursorKey: SyncCursorKeys.profiles,
    fetchRemoteRowsChangedSince: fetchRemoteProfilesChangedSince,
    getRowByIdSafe: getProfileByIdSafe,
    mapRemoteRowToLocal: mapRemoteProfileToLocal,
    upsertRowFromRemote: upsertProfileFromRemote,
  });
  console.log(`profiles applied: ${profilesApplied}`);
  const careLinksApplied = await pullRows<
    CareLinkRow,
    CareLinkInsert,
    Database["public"]["Tables"]["care_links"]["Row"]
  >({
    syncCursorKey: SyncCursorKeys.careLinks,
    fetchRemoteRowsChangedSince: fetchRemoteCareLinksChangedSince,
    getRowByIdSafe: getCareLinkByIdSafe,
    mapRemoteRowToLocal: mapRemoteCareLinkToLocal,
    upsertRowFromRemote: upsertCareLinkFromRemote,
  });
  console.log(`careLinks applied: ${careLinksApplied}`);
  const patientSettingsApplied = await pullRows<
    PatientSettingsRow,
    PatientSettingsInsert,
    Database["public"]["Tables"]["patient_settings"]["Row"]
  >({
    syncCursorKey: SyncCursorKeys.patientSettings,
    fetchRemoteRowsChangedSince: fetchRemotePatientSettingsChangedSince,
    getRowByIdSafe: getPatientSettingsByIdSafe,
    mapRemoteRowToLocal: mapRemotePatientSettingsToLocal,
    upsertRowFromRemote: upsertPatientSettingsFromRemote,
  });
  console.log(`patientSettings applied: ${patientSettingsApplied}`);
  const thresholdRulesApplied = await pullRows<
    ThresholdRuleRow,
    ThresholdRuleInsert,
    Database["public"]["Tables"]["threshold_rules"]["Row"]
  >({
    syncCursorKey: SyncCursorKeys.thresholdRules,
    fetchRemoteRowsChangedSince: fetchRemoteThresholdRulesChangedSince,
    getRowByIdSafe: getThresholdRuleByIdSafe,
    mapRemoteRowToLocal: mapRemoteThresholdRuleToLocal,
    upsertRowFromRemote: upsertThresholdRuleFromRemote,
  });
  console.log(`thresholdRules applied: ${thresholdRulesApplied}`);
  const readingsApplied = await pullRows<
    ReadingRow,
    ReadingInsert,
    Database["public"]["Tables"]["readings"]["Row"]
  >({
    syncCursorKey: SyncCursorKeys.readings,
    fetchRemoteRowsChangedSince: fetchRemoteReadingsChangedSince,
    getRowByIdSafe: getReadingByIdSafe,
    mapRemoteRowToLocal: mapRemoteReadingToLocal,
    upsertRowFromRemote: upsertReadingFromRemote,
  });
  console.log(`readings applied: ${readingsApplied}`);
  const followupsApplied = await pullRows<
    FollowupRow,
    FollowupInsert,
    Database["public"]["Tables"]["followups"]["Row"]
  >({
    syncCursorKey: SyncCursorKeys.followups,
    fetchRemoteRowsChangedSince: fetchRemoteFollowupsChangedSince,
    getRowByIdSafe: getFollowupByIdSafe,
    mapRemoteRowToLocal: mapRemoteFollowupToLocal,
    upsertRowFromRemote: upsertFollowupFromRemote,
  });
  console.log(`followups applied: ${followupsApplied}`);

  return (
    profilesApplied +
    careLinksApplied +
    patientSettingsApplied +
    thresholdRulesApplied +
    readingsApplied +
    followupsApplied
  );
};
