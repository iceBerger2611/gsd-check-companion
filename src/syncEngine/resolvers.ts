import { followupStateRank, FollowupStatus } from "@/src/db/schema";
import { CareLinkRow } from "@/src/repos/local/careLinks.repo";
import { FollowupRow } from "@/src/repos/local/followups.repo";
import { PatientSettingsRow } from "@/src/repos/local/patientSettings.repo";
import { ProfileRow } from "@/src/repos/local/profiles.repo";
import { ReadingRow } from "@/src/repos/local/readings.repo";
import { ThresholdRuleRow } from "@/src/repos/local/thresholdRules.repo";
import {
  RemoteCareLinkUpsertPayload,
  RemoteFollowupUpsertPayload,
  RemotePatientSettingsUpsertPayload,
  RemoteProfileUpsertPayload,
  RemoteReadingUpsertPayload,
  RemoteThresholdRuleUpsertPayload,
} from "@/src/repos/utils";
import {
  compareFields,
  createDefaultResolver,
  followupIdentityFields,
  isTerminalFollowupStatus,
  patientSettingsIdentityFields,
  readingImmutableFields,
  resolveByMutationTime,
} from "./utils";
import { ResolveConflictFn } from "./types";

type LocalProfile = ProfileRow;

export const resolveProfileConflict = createDefaultResolver<
  RemoteProfileUpsertPayload,
  LocalProfile
>(
  (local) => local?.deletedAt,
  (remote) => remote?.deleted_at,
);

type LocalThresholdRule = ThresholdRuleRow;

export const resolveThresholdRuleConflict = createDefaultResolver<
  RemoteThresholdRuleUpsertPayload,
  LocalThresholdRule
>(
  (local) => local?.deletedAt,
  (remote) => remote?.deleted_at,
);

type LocalCareLink = CareLinkRow;

export const resolveCareLinkConflict: ResolveConflictFn<
  RemoteCareLinkUpsertPayload,
  LocalCareLink
> = ({ localUpdatedAt, remoteUpdatedAt, local, remote }) => {
  const localDeletedAt = local?.deletedAt;
  const remoteDeletedAt = remote?.deleted_at;

  const sameUpdatedAt = localUpdatedAt === remoteUpdatedAt;
  const sameDeletedAt = localDeletedAt === remoteDeletedAt;
  const statusDiffers = local?.status !== remote?.status;

  if (statusDiffers && sameUpdatedAt && sameDeletedAt) {
    return {
      action: "mark_conflict",
      reason: "Care link status differs despite matching mutation timestamps",
    };
  }
  const baselineResolution = resolveByMutationTime(
    localUpdatedAt,
    remoteUpdatedAt,
    localDeletedAt || null,
    remoteDeletedAt || null,
  );
  return { action: baselineResolution };
};

type LocalReading = ReadingRow;

export const resolveReadingConflict: ResolveConflictFn<
  RemoteReadingUpsertPayload,
  LocalReading
> = ({ localUpdatedAt, remoteUpdatedAt, local, remote }) => {
  const localDeletedAt = local?.deletedAt;
  const remoteDeletedAt = remote?.deleted_at;

  const baselineResolution = resolveByMutationTime(
    localUpdatedAt,
    remoteUpdatedAt,
    localDeletedAt || null,
    remoteDeletedAt || null,
  );

  if (local && remote) {
    const result = compareFields<LocalReading, RemoteReadingUpsertPayload>(
      local,
      remote,
      readingImmutableFields,
    );
    if (!result.equal) {
      return {
        action: "mark_conflict",
        reason: `Immutable fields mismatch: ${result.failedField}`,
      };
    }
    const merged: LocalReading = {
      ...local,
      cornstarchPhotoUrl:
        remote.cornstarch_photo_url ?? local.cornstarchPhotoUrl,
      deletedAt: remote.deleted_at ?? local.deletedAt,
      meterPhotoUrl: remote.meter_photo_url ?? local.meterPhotoUrl,
      updatedAt:
        baselineResolution === "apply_remote"
          ? (remote.updated_at ?? local.updatedAt)
          : local.updatedAt,
    };
    return { action: "write_merged_local", row: merged };
  }

  return { action: baselineResolution };
};

type LocalFollowup = FollowupRow;

export const resolveFollowupConflict: ResolveConflictFn<
  RemoteFollowupUpsertPayload,
  LocalFollowup
> = ({ localUpdatedAt, remoteUpdatedAt, local, remote }) => {
  const localDeletedAt = local?.deletedAt;
  const remoteDeletedAt = remote?.deleted_at;

  const baselineWinner = resolveByMutationTime(
    localUpdatedAt,
    remoteUpdatedAt,
    localDeletedAt ?? null,
    remoteDeletedAt ?? null,
  );

  if (local && remote) {
    const identityResult = compareFields(local, remote, followupIdentityFields);

    if (!identityResult.equal) {
      return {
        action: "mark_conflict",
        reason: `Followup identity mismatch: ${identityResult.failedField}`,
      };
    }

    const localStatus = local.status as FollowupStatus | null;
    const remoteStatus = remote.status as FollowupStatus | null;

    const localTerminal = isTerminalFollowupStatus(localStatus);
    const remoteTerminal = isTerminalFollowupStatus(remoteStatus);

    let authoritativeStatusSource: "local" | "remote";

    if (localTerminal && !remoteTerminal) {
      authoritativeStatusSource = "local";
    } else if (!localTerminal && remoteTerminal) {
      authoritativeStatusSource = "remote";
    } else if (
      localTerminal &&
      remoteTerminal &&
      localStatus !== remoteStatus
    ) {
      const localRank = followupStateRank[localStatus];
      const remoteRank = followupStateRank[remoteStatus];

      if (localRank > remoteRank) authoritativeStatusSource = "local";
      else if (remoteRank > localRank) authoritativeStatusSource = "remote";
      else
        authoritativeStatusSource =
          baselineWinner === "keep_local" ? "local" : "remote";
    } else {
      authoritativeStatusSource =
        baselineWinner === "keep_local" ? "local" : "remote";
    }

    const merged: LocalFollowup = {
      ...local,
      status:
        authoritativeStatusSource === "remote"
          ? (remote.status ?? null)
          : local.status,
      scheduledNotificationIds: local.scheduledNotificationIds,
      photoPath: local.photoPath,
      photoUrl:
        authoritativeStatusSource === "remote"
          ? (remote.photo_url ?? null)
          : local.photoUrl,
      completedAt:
        authoritativeStatusSource === "remote"
          ? (remote.completed_at ?? local.completedAt)
          : (local.completedAt ?? remote.completed_at ?? null),
      deletedAt: remote.deleted_at ?? local.deletedAt,
      updatedAt:
        authoritativeStatusSource === "remote"
          ? (remote.updated_at ?? local.updatedAt)
          : local.updatedAt,
    };

    return { action: "write_merged_local", row: merged };
  }

  return { action: baselineWinner };
};

type LocalPatientSettings = PatientSettingsRow;

const resolvePatientSettingsDefault = createDefaultResolver<
  RemotePatientSettingsUpsertPayload,
  LocalPatientSettings
>(
  (local) => local?.deletedAt,
  (remote) => remote?.deleted_at,
);

export const resolvePatientSettingsConflict: ResolveConflictFn<
  RemotePatientSettingsUpsertPayload,
  LocalPatientSettings
> = ({ localUpdatedAt, remoteUpdatedAt, local, remote }) => {
  if (local && remote) {
    const identityResult = compareFields(
      local,
      remote,
      patientSettingsIdentityFields,
    );

    if (!identityResult.equal) {
      return {
        action: "mark_conflict",
        reason: `Patient Settings identity mismatch: ${identityResult.failedField}`,
      };
    }
  }

  return resolvePatientSettingsDefault({
    localUpdatedAt,
    remoteUpdatedAt,
    local,
    remote,
  });
};
