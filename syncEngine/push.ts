import {
  CareLinkInsert,
  CareLinkRow,
  listPendingCareLinks,
  markCareLinkFailed,
  markCareLinkSynced,
  upsertCareLinkFromRemote,
} from "@/repos/local/careLinks.repo";
import {
  FollowupInsert,
  FollowupRow,
  listPendingFollowups,
  markFollowupFailed,
  markFollowupSynced,
  upsertFollowupFromRemote,
} from "@/repos/local/followups.repo";
import {
  listPendingPatientSettingss,
  markPatientSettingsFailed,
  markPatientSettingsSynced,
  PatientSettingsInsert,
  PatientSettingsRow,
  upsertPatientSettingsFromRemote,
} from "@/repos/local/patientSettings.repo";
import {
  listPendingProfiles,
  markProfileFailed,
  markProfileSynced,
  ProfileInsert,
  ProfileRow,
  upsertProfileFromRemote,
} from "@/repos/local/profiles.repo";
import {
  listPendingReadings,
  markReadingFailed,
  markReadingSynced,
  ReadingInsert,
  ReadingRow,
  upsertReadingFromRemote,
} from "@/repos/local/readings.repo";
import {
  listPendingThresholdRules,
  markThresholdRuleFailed,
  markThresholdRuleSynced,
  ThresholdRuleInsert,
  ThresholdRuleRow,
  upsertThresholdRuleFromRemote,
} from "@/repos/local/thresholdRules.repo";
import {
  getRemoteCareLinkByIdSafe,
  RemoteCareLink,
  upsertRemoteCareLink,
} from "@/repos/remote/careLinks.remote";
import {
  getRemoteFollowupByIdSafe,
  RemoteFollowup,
  upsertRemoteFollowup,
} from "@/repos/remote/followups.remote";
import {
  getRemotePatientSettingsByIdSafe,
  RemotePatientSettings,
  upsertRemotePatientSettings,
} from "@/repos/remote/patientSettings.remote";
import {
  getRemoteProfileByIdSafe,
  RemoteProfile,
  upsertRemoteProfile,
} from "@/repos/remote/profiles.remote";
import {
  getRemoteReadingByIdSafe,
  RemoteReading,
  upsertRemoteReading,
} from "@/repos/remote/readings.remote";
import {
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
  PushPendingResult,
  PushPendingRowOptions,
} from "./types";
import {
  mapAndUpsertFromLocalPipeline,
  mapAndUpsertFromRemotePipeline,
  mergeAndUpsertFromLocalPipeline,
} from "./utils";

export const pushPendingRows = async <
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
>({
  listPendingRows,
  getRemoteRowByIdSafe,
  conflictResolver,
  mapLocalRowToRemote,
  markRowFailed,
  markRowSynced,
  upsertLocalRow,
  mapRemoteRowToLocal,
  upsertRemoteRow,
}: PushPendingRowOptions<
  TLocalRow,
  TLocalRowInsert,
  TRemoteRow,
  TRemoteRowInsert
>): Promise<PushPendingResult> => {
  const pendingRows = await listPendingRows();

  const result: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  for (const localRow of pendingRows) {
    result.attempted++;
    const remoteRow = await getRemoteRowByIdSafe(localRow.id);
    if (remoteRow) {
      const verdict = conflictResolver({
        localUpdatedAt: localRow.updatedAt,
        remoteUpdatedAt: remoteRow.updated_at,
        local: localRow,
        remote: remoteRow,
      });
      switch (verdict.action) {
        case "apply_remote": {
          const pipelineResult = await mapAndUpsertFromRemotePipeline({
            localRow,
            remoteRow,
            mapRemoteRowToLocal,
            markRowFailed,
            markRowSynced,
            upsertLocalRow,
          });
          if (pipelineResult.isSuccessful) {
            result.succeeded++;
          } else {
            result.failed++;
          }
          continue;
        }
        case "keep_local": {
          const pipelineResult = await mapAndUpsertFromLocalPipeline({
            localRow,
            mapLocalRowToRemote,
            markRowFailed,
            markRowSynced,
            upsertRemoteRow,
          });
          if (pipelineResult.isSuccessful) {
            result.succeeded++;
          } else {
            result.failed++;
          }
          continue;
        }
        case "mark_conflict": {
          await markRowFailed(localRow.id, getErrorMessage(verdict.reason));
          result.failed++;
          continue;
        }
        case "write_merged_local": {
          // Push merged local truth to remote, then re-read canonical remote
          // and persist that canonical version locally.
          const pipelineResult = await mergeAndUpsertFromLocalPipeline({
            getRemoteRowByIdSafe,
            localRow,
            mapLocalRowToRemote,
            mapRemoteRowToLocal,
            markRowFailed,
            markRowSynced,
            upsertLocalRow,
            upsertRemoteRow,
          });
          if (pipelineResult.isSuccessful) {
            result.succeeded++;
          } else {
            result.failed++;
          }
          continue;
        }
        default: {
          throw new Error(
            `Unhandled conflict action: ${JSON.stringify(verdict)}`,
          );
        }
      }
    }
    const pipelineResult = await mapAndUpsertFromLocalPipeline({
      localRow,
      mapLocalRowToRemote,
      markRowFailed,
      markRowSynced,
      upsertRemoteRow,
    });
    if (pipelineResult.isSuccessful) {
      result.succeeded++;
    } else {
      result.failed++;
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
    ProfileInsert,
    RemoteProfile,
    RemoteProfileUpsertPayload
  >({
    listPendingRows: listPendingProfiles,
    getRemoteRowByIdSafe: getRemoteProfileByIdSafe,
    conflictResolver: resolveProfileConflict,
    mapLocalRowToRemote: mapLocalProfileToRemote,
    mapRemoteRowToLocal: mapRemoteProfileToLocal,
    markRowFailed: markProfileFailed,
    markRowSynced: markProfileSynced,
    upsertLocalRow: upsertProfileFromRemote,
    upsertRemoteRow: upsertRemoteProfile,
  });
  const careLinkResults = await pushPendingRows<
    CareLinkRow,
    CareLinkInsert,
    RemoteCareLink,
    RemoteCareLinkUpsertPayload
  >({
    listPendingRows: listPendingCareLinks,
    getRemoteRowByIdSafe: getRemoteCareLinkByIdSafe,
    conflictResolver: resolveCareLinkConflict,
    mapLocalRowToRemote: mapLocalCareLinkToRemote,
    mapRemoteRowToLocal: mapRemoteCareLinkToLocal,
    markRowFailed: markCareLinkFailed,
    markRowSynced: markCareLinkSynced,
    upsertLocalRow: upsertCareLinkFromRemote,
    upsertRemoteRow: upsertRemoteCareLink,
  });
  const patientSettingsResults = await pushPendingRows<
    PatientSettingsRow,
    PatientSettingsInsert,
    RemotePatientSettings,
    RemotePatientSettingsUpsertPayload
  >({
    listPendingRows: listPendingPatientSettingss,
    getRemoteRowByIdSafe: getRemotePatientSettingsByIdSafe,
    conflictResolver: resolvePatientSettingsConflict,
    mapLocalRowToRemote: mapLocalPatientSettingsToRemote,
    mapRemoteRowToLocal: mapRemotePatientSettingsToLocal,
    markRowFailed: markPatientSettingsFailed,
    markRowSynced: markPatientSettingsSynced,
    upsertLocalRow: upsertPatientSettingsFromRemote,
    upsertRemoteRow: upsertRemotePatientSettings,
  });
  const thresholdRuleResults = await pushPendingRows<
    ThresholdRuleRow,
    ThresholdRuleInsert,
    RemoteThresholdRule,
    RemoteThresholdRuleUpsertPayload
  >({
    listPendingRows: listPendingThresholdRules,
    getRemoteRowByIdSafe: getRemoteThresholdRuleByIdSafe,
    conflictResolver: resolveThresholdRuleConflict,
    mapLocalRowToRemote: mapLocalThresholdRuleToRemote,
    mapRemoteRowToLocal: mapRemoteThresholdRuleToLocal,
    markRowFailed: markThresholdRuleFailed,
    markRowSynced: markThresholdRuleSynced,
    upsertLocalRow: upsertThresholdRuleFromRemote,
    upsertRemoteRow: upsertRemoteThresholdRule,
  });
  const readingResults = await pushPendingRows<
    ReadingRow,
    ReadingInsert,
    RemoteReading,
    RemoteReadingUpsertPayload
  >({
    listPendingRows: listPendingReadings,
    getRemoteRowByIdSafe: getRemoteReadingByIdSafe,
    conflictResolver: resolveReadingConflict,
    mapLocalRowToRemote: mapLocalReadingToRemote,
    mapRemoteRowToLocal: mapRemoteReadingToLocal,
    markRowFailed: markReadingFailed,
    markRowSynced: markReadingSynced,
    upsertLocalRow: upsertReadingFromRemote,
    upsertRemoteRow: upsertRemoteReading,
  });
  const followupResults = await pushPendingRows<
    FollowupRow,
    FollowupInsert,
    RemoteFollowup,
    RemoteFollowupUpsertPayload
  >({
    listPendingRows: listPendingFollowups,
    getRemoteRowByIdSafe: getRemoteFollowupByIdSafe,
    conflictResolver: resolveFollowupConflict,
    mapLocalRowToRemote: mapLocalFollowupToRemote,
    mapRemoteRowToLocal: mapRemoteFollowupToLocal,
    markRowFailed: markFollowupFailed,
    markRowSynced: markFollowupSynced,
    upsertLocalRow: upsertFollowupFromRemote,
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
