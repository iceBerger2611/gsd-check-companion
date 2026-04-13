import { SyncCursorKeys } from "@/db/schema";
import {
  CareLinkInsert,
  CareLinkRow,
  getCareLinkByIdSafe,
  markCareLinkFailed,
  markCareLinkSynced,
  upsertCareLinkFromRemote,
} from "@/repos/local/careLinks.repo";
import {
  FollowupInsert,
  FollowupRow,
  getFollowupByIdSafe,
  markFollowupFailed,
  markFollowupSynced,
  upsertFollowupFromRemote,
} from "@/repos/local/followups.repo";
import {
  getPatientSettingsByIdSafe,
  markPatientSettingsFailed,
  markPatientSettingsSynced,
  PatientSettingsInsert,
  PatientSettingsRow,
  upsertPatientSettingsFromRemote,
} from "@/repos/local/patientSettings.repo";
import {
  getProfileByIdSafe,
  markProfileFailed,
  markProfileSynced,
  ProfileInsert,
  ProfileRow,
  upsertProfileFromRemote,
} from "@/repos/local/profiles.repo";
import {
  getReadingByIdSafe,
  markReadingFailed,
  markReadingSynced,
  ReadingInsert,
  ReadingRow,
  upsertReadingFromRemote,
} from "@/repos/local/readings.repo";
import { getSyncCursor, setSyncCursor } from "@/repos/local/syncState.repo";
import {
  getThresholdRuleByIdSafe,
  markThresholdRuleFailed,
  markThresholdRuleSynced,
  ThresholdRuleInsert,
  ThresholdRuleRow,
  upsertThresholdRuleFromRemote,
} from "@/repos/local/thresholdRules.repo";
import {
  fetchRemoteCareLinksChangedSince,
  getRemoteCareLinkByIdSafe,
  RemoteCareLink,
  upsertRemoteCareLink,
} from "@/repos/remote/careLinks.remote";
import {
  fetchRemoteFollowupsChangedSince,
  getRemoteFollowupByIdSafe,
  RemoteFollowup,
  upsertRemoteFollowup,
} from "@/repos/remote/followups.remote";
import {
  fetchRemotePatientSettingsChangedSince,
  getRemotePatientSettingsByIdSafe,
  RemotePatientSettings,
  upsertRemotePatientSettings,
} from "@/repos/remote/patientSettings.remote";
import {
  fetchRemoteProfilesChangedSince,
  getRemoteProfileByIdSafe,
  RemoteProfile,
  upsertRemoteProfile,
} from "@/repos/remote/profiles.remote";
import {
  fetchRemoteReadingsChangedSince,
  getRemoteReadingByIdSafe,
  RemoteReading,
  upsertRemoteReading,
} from "@/repos/remote/readings.remote";
import {
  fetchRemoteThresholdRulesChangedSince,
  getRemoteThresholdRuleByIdSafe,
  RemoteThresholdRule,
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
import {
  resolveCareLinkConflict,
  resolveFollowupConflict,
  resolvePatientSettingsConflict,
  resolveProfileConflict,
  resolveReadingConflict,
  resolveThresholdRuleConflict,
} from "./resolvers";
import {
  BasicLocalEntityShape,
  BasicLocalInsertEntityShape,
  BasicRemoteEntityShape,
  BasicRemoteInsertEntityShape,
  PullResult,
  PullRowsOptions,
} from "./types";
import {
  mapAndUpsertFromRemotePipeline,
  mergeAndUpsertFromLocalPipeline,
} from "./utils";

export const pullRows = async <
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
>({
  syncCursorKey,
  fetchRemoteRowsChangedSince,
  conflictResolver,
  getRowByIdSafe,
  getRemoteRowByIdSafe,
  mapLocalRowToRemote,
  mapRemoteRowToLocal,
  markRowFailed,
  markRowSynced,
  upsertLocalRow,
  upsertRemoteRow,
}: PullRowsOptions<
  TLocalRow,
  TLocalRowInsert,
  TRemoteRow,
  TRemoteRowInsert
>): Promise<PullResult> => {
  const pullResult: PullResult = {
    attempted: 0,
    pullFailed: 0,
    pullSucceeded: 0,
    pullNotApplied: 0,
  };
  const lastPulledAt = await getSyncCursor(syncCursorKey);
  const remoteRows = await fetchRemoteRowsChangedSince(lastPulledAt);

  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    pullResult.attempted++;

    if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
      maxUpdatedAt = remoteRow.updated_at;
    }

    const localRow = await getRowByIdSafe(remoteRow.id);

    if (localRow) {
      const verdict = conflictResolver({
        local: localRow,
        localUpdatedAt: localRow.updatedAt,
        remote: remoteRow,
        remoteUpdatedAt: remoteRow.updated_at,
      });
      switch (verdict.action) {
        case "apply_remote": {
          const pipelineResult = await mapAndUpsertFromRemotePipeline({
            localRow,
            mapRemoteRowToLocal,
            markRowFailed,
            markRowSynced,
            remoteRow,
            upsertLocalRow,
          });
          if (pipelineResult.isSuccessful) {
            pullResult.pullSucceeded++;
          } else {
            pullResult.pullFailed++;
          }
          continue;
        }
        case "keep_local": {
          pullResult.pullNotApplied++;
          continue;
        }
        case "write_merged_local": {
          const pipelineResult = await mergeAndUpsertFromLocalPipeline({
            getRemoteRowByIdSafe,
            localRow: verdict.row,
            mapLocalRowToRemote,
            mapRemoteRowToLocal,
            markRowFailed,
            markRowSynced,
            upsertLocalRow,
            upsertRemoteRow,
          });

          if (pipelineResult.isSuccessful) {
            pullResult.pullSucceeded++;
          } else {
            pullResult.pullFailed++;
          }
          continue;
        }
        case "mark_conflict": {
          await markRowFailed(remoteRow.id, getErrorMessage(verdict.reason));
          pullResult.pullFailed++;
          continue;
        }
        default:
          throw new Error(
            `Unhandled conflict action: ${JSON.stringify(verdict)}`,
          );
      }
    }

    try {
      const payload = mapRemoteRowToLocal(remoteRow);
      await upsertLocalRow(payload);
      pullResult.pullSucceeded++;
    } catch {
      pullResult.pullFailed++;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(syncCursorKey, maxUpdatedAt);
  }

  return pullResult;
};

export const pullChanges = async (): Promise<PullResult> => {
  const profilesApplied = await pullRows<
    ProfileRow,
    ProfileInsert,
    RemoteProfile,
    RemoteProfileUpsertPayload
  >({
    syncCursorKey: SyncCursorKeys.profiles,
    fetchRemoteRowsChangedSince: fetchRemoteProfilesChangedSince,
    getRowByIdSafe: getProfileByIdSafe,
    mapRemoteRowToLocal: mapRemoteProfileToLocal,
    upsertLocalRow: upsertProfileFromRemote,
    conflictResolver: resolveProfileConflict,
    getRemoteRowByIdSafe: getRemoteProfileByIdSafe,
    mapLocalRowToRemote: mapLocalProfileToRemote,
    markRowFailed: markProfileFailed,
    markRowSynced: markProfileSynced,
    upsertRemoteRow: upsertRemoteProfile,
  });

  const careLinksApplied = await pullRows<
    CareLinkRow,
    CareLinkInsert,
    RemoteCareLink,
    RemoteCareLinkUpsertPayload
  >({
    syncCursorKey: SyncCursorKeys.careLinks,
    fetchRemoteRowsChangedSince: fetchRemoteCareLinksChangedSince,
    getRowByIdSafe: getCareLinkByIdSafe,
    mapRemoteRowToLocal: mapRemoteCareLinkToLocal,
    upsertLocalRow: upsertCareLinkFromRemote,
    conflictResolver: resolveCareLinkConflict,
    getRemoteRowByIdSafe: getRemoteCareLinkByIdSafe,
    mapLocalRowToRemote: mapLocalCareLinkToRemote,
    markRowFailed: markCareLinkFailed,
    markRowSynced: markCareLinkSynced,
    upsertRemoteRow: upsertRemoteCareLink,
  });

  const patientSettingsApplied = await pullRows<
    PatientSettingsRow,
    PatientSettingsInsert,
    RemotePatientSettings,
    RemotePatientSettingsUpsertPayload
  >({
    syncCursorKey: SyncCursorKeys.patientSettings,
    fetchRemoteRowsChangedSince: fetchRemotePatientSettingsChangedSince,
    getRowByIdSafe: getPatientSettingsByIdSafe,
    mapRemoteRowToLocal: mapRemotePatientSettingsToLocal,
    upsertLocalRow: upsertPatientSettingsFromRemote,
    conflictResolver: resolvePatientSettingsConflict,
    getRemoteRowByIdSafe: getRemotePatientSettingsByIdSafe,
    mapLocalRowToRemote: mapLocalPatientSettingsToRemote,
    markRowFailed: markPatientSettingsFailed,
    markRowSynced: markPatientSettingsSynced,
    upsertRemoteRow: upsertRemotePatientSettings,
  });

  const thresholdRulesApplied = await pullRows<
    ThresholdRuleRow,
    ThresholdRuleInsert,
    RemoteThresholdRule,
    RemoteThresholdRuleUpsertPayload
  >({
    syncCursorKey: SyncCursorKeys.thresholdRules,
    fetchRemoteRowsChangedSince: fetchRemoteThresholdRulesChangedSince,
    getRowByIdSafe: getThresholdRuleByIdSafe,
    mapRemoteRowToLocal: mapRemoteThresholdRuleToLocal,
    upsertLocalRow: upsertThresholdRuleFromRemote,
    conflictResolver: resolveThresholdRuleConflict,
    getRemoteRowByIdSafe: getRemoteThresholdRuleByIdSafe,
    mapLocalRowToRemote: mapLocalThresholdRuleToRemote,
    markRowFailed: markThresholdRuleFailed,
    markRowSynced: markThresholdRuleSynced,
    upsertRemoteRow: upsertRemoteThresholdRule,
  });

  const readingsApplied = await pullRows<
    ReadingRow,
    ReadingInsert,
    RemoteReading,
    RemoteReadingUpsertPayload
  >({
    syncCursorKey: SyncCursorKeys.readings,
    fetchRemoteRowsChangedSince: fetchRemoteReadingsChangedSince,
    getRowByIdSafe: getReadingByIdSafe,
    mapRemoteRowToLocal: mapRemoteReadingToLocal,
    upsertLocalRow: upsertReadingFromRemote,
    conflictResolver: resolveReadingConflict,
    getRemoteRowByIdSafe: getRemoteReadingByIdSafe,
    mapLocalRowToRemote: mapLocalReadingToRemote,
    markRowFailed: markReadingFailed,
    markRowSynced: markReadingSynced,
    upsertRemoteRow: upsertRemoteReading,
  });

  const followupsApplied = await pullRows<
    FollowupRow,
    FollowupInsert,
    RemoteFollowup,
    RemoteFollowupUpsertPayload
  >({
    syncCursorKey: SyncCursorKeys.followups,
    fetchRemoteRowsChangedSince: fetchRemoteFollowupsChangedSince,
    getRowByIdSafe: getFollowupByIdSafe,
    mapRemoteRowToLocal: mapRemoteFollowupToLocal,
    upsertLocalRow: upsertFollowupFromRemote,
    conflictResolver: resolveFollowupConflict,
    getRemoteRowByIdSafe: getRemoteFollowupByIdSafe,
    mapLocalRowToRemote: mapLocalFollowupToRemote,
    markRowFailed: markFollowupFailed,
    markRowSynced: markFollowupSynced,
    upsertRemoteRow: upsertRemoteFollowup,
  });

  return {
    attempted:
      profilesApplied.attempted +
      careLinksApplied.attempted +
      patientSettingsApplied.attempted +
      thresholdRulesApplied.attempted +
      readingsApplied.attempted +
      followupsApplied.attempted,
    pullFailed:
      profilesApplied.pullFailed +
      careLinksApplied.pullFailed +
      patientSettingsApplied.pullFailed +
      thresholdRulesApplied.pullFailed +
      readingsApplied.pullFailed +
      followupsApplied.pullFailed,
    pullSucceeded:
      profilesApplied.pullSucceeded +
      careLinksApplied.pullSucceeded +
      patientSettingsApplied.pullSucceeded +
      thresholdRulesApplied.pullSucceeded +
      readingsApplied.pullSucceeded +
      followupsApplied.pullSucceeded,
    pullNotApplied:
      profilesApplied.pullNotApplied +
      careLinksApplied.pullNotApplied +
      patientSettingsApplied.pullNotApplied +
      thresholdRulesApplied.pullNotApplied +
      readingsApplied.pullNotApplied +
      followupsApplied.pullNotApplied,
  };
};
