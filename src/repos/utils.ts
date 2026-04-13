import * as Crypto from "expo-crypto";
import { Action, followupTypes, interventions } from "@/db/schema";
import { Database } from "@/types/database.types";
import { CareLinkInsert, CareLinkRow } from "./local/careLinks.repo";
import { FollowupInsert, FollowupRow } from "./local/followups.repo";
import {
  PatientSettingsInsert,
  PatientSettingsRow,
} from "./local/patientSettings.repo";
import { ProfileInsert, ProfileRow } from "./local/profiles.repo";
import { ReadingInsert, ReadingRow } from "./local/readings.repo";
import {
  ThresholdRuleInsert,
  ThresholdRuleRow,
} from "./local/thresholdRules.repo";

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isAction = (value: unknown): value is Action => {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "intervention":
      return (
        typeof value.intervention === "string" &&
        (interventions as readonly string[]).includes(value.intervention)
      );
    case "followup":
      return (
        typeof value.followupType === "string" &&
        (followupTypes as readonly string[]).includes(value.followupType) &&
        typeof value.followupDelay === "number"
      );
    default:
      return false;
  }
};

export const isActionArray = (value: unknown): value is Action[] => {
  return Array.isArray(value) && value.every(isAction);
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export function nowIso() {
  return new Date().toISOString();
}

export function buildPendingCreateFields() {
  const now = nowIso();
  return {
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: "pending" as const,
    lastSyncedAt: null,
    syncError: null,
  };
}

export function buildPendingUpdateFields() {
  return {
    updatedAt: nowIso(),
    syncStatus: "pending" as const,
    syncError: null,
  };
}

export function buildPendingDeleteFields() {
  const now = nowIso();
  return {
    deletedAt: now,
    updatedAt: now,
    syncStatus: "pending" as const,
    syncError: null,
  };
}

export type RemoteReadingUpsertPayload = Omit<
  Database["public"]["Tables"]["readings"]["Insert"],
  "sync_status" | "last_synced_at" | "sync_error"
>;

export type RemoteFollowupUpsertPayload = Omit<
  Database["public"]["Tables"]["followups"]["Insert"],
  "sync_status" | "last_synced_at" | "sync_error"
>;

export type RemoteThresholdRuleUpsertPayload = Omit<
  Database["public"]["Tables"]["threshold_rules"]["Insert"],
  "sync_status" | "last_synced_at" | "sync_error"
>;

export type RemoteCareLinkUpsertPayload = Omit<
  Database["public"]["Tables"]["care_links"]["Insert"],
  "sync_status" | "last_synced_at" | "sync_error"
>;

export type RemoteProfileUpsertPayload = Omit<
  Database["public"]["Tables"]["profiles"]["Insert"],
  "sync_status" | "last_synced_at" | "sync_error"
>;

export type RemotePatientSettingsUpsertPayload =
  Database["public"]["Tables"]["patient_settings"]["Insert"];

export const createBasicPatientSettings = (
  patientId: string,
): PatientSettingsInsert => ({
  id: Crypto.randomUUID(),
  patientId,
  followupSpacingMinutes: 180,
  notificationCount: 4,
  notificationSpacingMinutes: 4,
  windowEndMinuteOfDay: null,
  windowNotificationCount: null,
  windowNotificationSpacingMinutes: null,
  windowStartMinuteOfDay: null,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  lastSyncedAt: nowIso(),
  syncError: null,
  syncStatus: 'synced' as const
});

export const mapLocalReadingToRemote = (
  row: ReadingRow,
): RemoteReadingUpsertPayload => {
  if (!row.id) throw new Error("Reading missing id");
  if (!row.patientId) throw new Error("Reading missing patientId");
  if (row.glucoseValue == null) throw new Error("Reading missing glucoseValue");
  if (!row.recordedAt) throw new Error("Reading missing recordedAt");

  return {
    id: row.id,
    patient_id: row.patientId,
    glucose_value: row.glucoseValue,
    outcome: row.outcome ?? "",
    unit: row.unit ?? "",
    cornstarch_photo_url: row.cornstarchPhotoUrl,
    meter_photo_url: row.meterPhotoUrl,
    note: row.note,
    was_overridden: row.wasOverridden,
    recorded_at: row.recordedAt,
    created_at: row.createdAt ?? undefined,
    updated_at: row.updatedAt ?? undefined,
    deleted_at: row.deletedAt,
    evaluated_decision: row.evaluatedDecision,
    final_decision: row.finalDecision,
  };
};

export const mapLocalFollowupToRemote = (
  row: FollowupRow,
): RemoteFollowupUpsertPayload => {
  if (!row.id) throw new Error("Followup missing id");
  if (!row.status) throw new Error("Followup missing status");
  if (!row.patientId) throw new Error("Followup missing patientId");
  if (!row.readingId) throw new Error("Followup missing readingId");
  if (!row.dueAt) throw new Error("Followup missing dueAt");

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    photo_url: row.photoUrl,
    photo_path: row.photoPath,
    scheduled_notification_ids: row.scheduledNotificationIds,
    patient_id: row.patientId,
    reading_id: row.readingId,
    due_at: row.dueAt,
    created_at: row.createdAt ?? undefined,
    updated_at: row.updatedAt ?? undefined,
    completed_at: row.completedAt,
    deleted_at: row.deletedAt,
  };
};

export const mapLocalThresholdRuleToRemote = (
  row: ThresholdRuleRow,
): RemoteThresholdRuleUpsertPayload => {
  if (!row.id) throw new Error("ThresholdRule missing id");
  if (!row.classification)
    throw new Error("ThresholdRule missing classification");
  if (!row.label) throw new Error("ThresholdRule missing label");
  if (!row.patientId) throw new Error("ThresholdRule missing patientId");
  if (!row.actions) throw new Error("ThresholdRule missing actions");

  return {
    id: row.id,
    classification: row.classification,
    label: row.label,
    patient_id: row.patientId,
    actions: row.actions,
    max_value: row.maxValue,
    min_value: row.minValue,
    created_at: row.createdAt ?? undefined,
    updated_at: row.updatedAt ?? undefined,
    deleted_at: row.deletedAt,
  };
};

export const mapLocalCareLinkToRemote = (
  row: CareLinkRow,
): RemoteCareLinkUpsertPayload => {
  if (!row.id) throw new Error("CareLink missing id");
  if (!row.patientId) throw new Error("CareLink missing patientId");
  if (!row.supervisorId) throw new Error("CareLink missing supervisorId");
  if (!row.status) throw new Error("CareLink missing status");

  return {
    id: row.id,
    patient_id: row.patientId,
    supervisor_id: row.supervisorId,
    status: row.status,
    created_at: row.createdAt ?? undefined,
    updated_at: row.updatedAt ?? undefined,
    deleted_at: row.deletedAt,
  };
};

export const mapLocalProfileToRemote = (
  row: ProfileRow,
): RemoteProfileUpsertPayload => {
  if (!row.id) throw new Error("Profile missing id");
  if (!row.role) throw new Error("Profile missing role");

  return {
    id: row.id,
    display_name: row.displayName,
    role: row.role,
    created_at: row.createdAt ?? undefined,
    updated_at: row.updatedAt ?? undefined,
    deleted_at: row.deletedAt,
  };
};

export function mapRemoteProfileToLocal(
  row: Database["public"]["Tables"]["profiles"]["Row"],
): ProfileInsert {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: "synced",
    lastSyncedAt: nowIso(),
    syncError: null,
  };
}

export function mapRemoteCareLinkToLocal(
  row: Database["public"]["Tables"]["care_links"]["Row"],
): CareLinkInsert {
  return {
    id: row.id,
    patientId: row.patient_id,
    status: row.status,
    supervisorId: row.supervisor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: "synced",
    lastSyncedAt: nowIso(),
    syncError: null,
  };
}

export function mapRemoteThresholdRuleToLocal(
  row: Database["public"]["Tables"]["threshold_rules"]["Row"],
): ThresholdRuleInsert {
  return {
    id: row.id,
    patientId: row.patient_id,
    actions: isActionArray(row.actions) ? row.actions : [],
    classification: row.classification,
    label: row.label,
    maxValue: row.max_value,
    minValue: row.min_value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: "synced",
    lastSyncedAt: nowIso(),
    syncError: null,
  };
}

export function mapRemoteReadingToLocal(
  row: Database["public"]["Tables"]["readings"]["Row"],
): ReadingInsert {
  return {
    id: row.id,
    patientId: row.patient_id,
    cornstarchPhotoUrl: row.cornstarch_photo_url,
    meterPhotoUrl: row.meter_photo_url,
    evaluatedDecision: isAction(row.evaluated_decision)
      ? row.evaluated_decision
      : null,
    finalDecision: isAction(row.final_decision) ? row.final_decision : null,
    glucoseValue: row.glucose_value,
    note: row.note,
    outcome: row.outcome,
    recordedAt: row.recorded_at,
    unit: row.unit,
    wasOverridden: row.was_overridden ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: "synced",
    lastSyncedAt: nowIso(),
    syncError: null,
  };
}

export function mapRemoteFollowupToLocal(
  row: Database["public"]["Tables"]["followups"]["Row"],
): FollowupInsert {
  return {
    id: row.id,
    patientId: row.patient_id,
    scheduledNotificationIds: row.scheduled_notification_ids,
    type: row.type,
    photoPath: row.photo_path,
    photoUrl: row.photo_url,
    readingId: row.reading_id,
    status: row.status,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: "synced",
    lastSyncedAt: nowIso(),
    syncError: null,
  };
}

export const mapRemotePatientSettingsToLocal = (
  row: Database["public"]["Tables"]["patient_settings"]["Row"],
): PatientSettingsInsert => ({
  id: row.id,
  patientId: row.patient_id,
  followupSpacingMinutes: row.followup_spacing_minutes,
  notificationSpacingMinutes: row.notification_spacing_minutes,
  notificationCount: row.notification_count,
  windowStartMinuteOfDay: row.window_start_minute_of_day,
  windowEndMinuteOfDay: row.window_end_minute_of_day,
  windowNotificationSpacingMinutes: row.window_notification_spacing_minutes,
  windowNotificationCount: row.window_notification_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  syncStatus: "synced",
  lastSyncedAt: new Date().toISOString(),
  syncError: null,
});

export const mapLocalPatientSettingsToRemote = (
  row: PatientSettingsRow,
): Database["public"]["Tables"]["patient_settings"]["Insert"] => ({
  id: row.id,
  patient_id: row.patientId,
  followup_spacing_minutes: row.followupSpacingMinutes,
  notification_spacing_minutes: row.notificationSpacingMinutes,
  notification_count: row.notificationCount,
  window_start_minute_of_day: row.windowStartMinuteOfDay,
  window_end_minute_of_day: row.windowEndMinuteOfDay,
  window_notification_spacing_minutes: row.windowNotificationSpacingMinutes,
  window_notification_count: row.windowNotificationCount,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
  deleted_at: row.deletedAt,
});
