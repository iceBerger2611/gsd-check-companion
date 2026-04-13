import { Action, FollowupStatus } from "@/db/schema";
import { FollowupRow } from "@/repos/local/followups.repo";
import { PatientSettingsRow } from "@/repos/local/patientSettings.repo";
import { ReadingRow } from "@/repos/local/readings.repo";
import { getErrorMessage } from "@/repos/utils";
import { Database } from "@/types/database.types";
import {
  BasicLocalEntityShape,
  BasicLocalInsertEntityShape,
  BasicRemoteEntityShape,
  BasicRemoteInsertEntityShape,
  FieldPair,
  MapAndUpsertFromLocalPipelineProps,
  MapAndUpsertFromRemotePipelineProps,
  MergeAndUpsertFromLocalPipelineProps,
  ResolveConflictFn,
} from "./types";

export const readingImmutableFields = [
  {
    localKey: "evaluatedDecision",
    remoteKey: "evaluated_decision",
    equals: (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      const decisionA = a as Action;
      const decisionB = b as Action;
      return actionComparisonFunc(decisionA, decisionB);
    },
  },
  {
    localKey: "finalDecision",
    remoteKey: "final_decision",
    equals: (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      const decisionA = a as Action;
      const decisionB = b as Action;
      return actionComparisonFunc(decisionA, decisionB);
    },
  },
  {
    localKey: "glucoseValue",
    remoteKey: "glucose_value",
    equals: (a, b) => a === b,
  },
  { localKey: "id", remoteKey: "id", equals: (a, b) => a === b },
  { localKey: "note", remoteKey: "note", equals: (a, b) => a === b },
  { localKey: "outcome", remoteKey: "outcome", equals: (a, b) => a === b },
  {
    localKey: "patientId",
    remoteKey: "patient_id",
    equals: (a, b) => a === b,
  },
  {
    localKey: "recordedAt",
    remoteKey: "recorded_at",
    equals: (a, b) => a === b,
  },
  { localKey: "unit", remoteKey: "unit", equals: (a, b) => a === b },
  {
    localKey: "wasOverridden",
    remoteKey: "was_overridden",
    equals: (a, b) => a === b,
  },
] satisfies FieldPair<
  ReadingRow,
  Database["public"]["Tables"]["readings"]["Row"]
>[];

export const followupIdentityFields = [
  { localKey: "id", remoteKey: "id", equals: (a, b) => a === b },
  { localKey: "patientId", remoteKey: "patient_id", equals: (a, b) => a === b },
  { localKey: "readingId", remoteKey: "reading_id", equals: (a, b) => a === b },
] satisfies FieldPair<
  FollowupRow,
  Database["public"]["Tables"]["followups"]["Row"]
>[];

export const patientSettingsIdentityFields = [
  { localKey: "id", remoteKey: "id", equals: (a, b) => a === b },
  { localKey: "patientId", remoteKey: "patient_id", equals: (a, b) => a === b },
] satisfies FieldPair<
  PatientSettingsRow,
  Database["public"]["Tables"]["patient_settings"]["Row"]
>[];

export const defaultEquals = (a: unknown, b: unknown) => {
  return Object.is(a, b);
};

export const parseTime = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

export const actionComparisonFunc = (
  actionA: Action,
  actionB: Action,
): boolean => {
  if (actionA.type !== actionB.type) return false;
  if (actionA.type === "followup" && actionB.type === "followup") {
    return (
      actionA.followupDelay === actionB.followupDelay &&
      actionA.followupType === actionB.followupType
    );
  } else if (
    actionA.type === "intervention" &&
    actionB.type === "intervention"
  ) {
    return actionA.intervention === actionB.intervention;
  }
  return false;
};

export const isTerminalFollowupStatus = (
  status: FollowupStatus | null | undefined,
) => status === "completed" || status === "dismissed";

export const getEffectiveMutationTime = (
  updatedAt: string | null | undefined,
  deletedAt: string | null | undefined,
): number | null => {
  const updated = parseTime(updatedAt);
  const deleted = parseTime(deletedAt);

  if (updated == null && deleted == null) return null;
  if (updated == null) return deleted;
  if (deleted == null) return updated;
  return Math.max(updated, deleted);
};

export const resolveByMutationTime = (
  localUpdatedAt?: string | null,
  remoteUpdatedAt?: string | null,
  localDeletedAt?: string | null,
  remoteDeletedAt?: string | null,
): "keep_local" | "apply_remote" => {
  const localTime = getEffectiveMutationTime(localUpdatedAt, localDeletedAt);
  const remoteTime = getEffectiveMutationTime(remoteUpdatedAt, remoteDeletedAt);

  if (localTime == null && remoteTime == null) return "apply_remote";
  if (localTime == null) return "apply_remote";
  if (remoteTime == null) return "keep_local";

  return localTime > remoteTime ? "keep_local" : "apply_remote";
};

export const createDefaultResolver = <TRemote, TLocal>(
  getLocalDeletedAt: (local?: TLocal) => string | null | undefined,
  getRemoteDeletedAt: (remote?: TRemote) => string | null | undefined,
): ResolveConflictFn<TRemote, TLocal> => {
  return ({ localUpdatedAt, remoteUpdatedAt, local, remote }) => {
    const winner = resolveByMutationTime(
      localUpdatedAt,
      remoteUpdatedAt,
      getLocalDeletedAt(local) ?? null,
      getRemoteDeletedAt(remote) ?? null,
    );

    return { action: winner };
  };
};

export const compareFields = <TLocal, TRemote>(
  local: TLocal,
  remote: TRemote,
  fields: FieldPair<TLocal, TRemote>[],
): { equal: boolean; failedField?: string } => {
  for (const field of fields) {
    const equals = field.equals ?? Object.is;

    if (!equals(local[field.localKey], remote[field.remoteKey])) {
      return { equal: false, failedField: String(field.localKey) };
    }
  }

  return { equal: true };
};

export const mapAndUpsertFromRemotePipeline = async <
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
>({
  localRow,
  remoteRow,
  mapRemoteRowToLocal,
  markRowFailed,
  markRowSynced,
  upsertLocalRow,
}: MapAndUpsertFromRemotePipelineProps<
  TLocalRow,
  TLocalRowInsert,
  TRemoteRow,
  TRemoteRowInsert
>): Promise<
  { isSuccessful: true } | { isSuccessful: false; error: string }
> => {
  try {
    const localPayload = mapRemoteRowToLocal(remoteRow);
    await upsertLocalRow(localPayload);
    await markRowSynced(localRow.id);
    return { isSuccessful: true };
  } catch (error) {
    await markRowFailed(localRow.id, getErrorMessage(error));
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const mapAndUpsertFromLocalPipeline = async <
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
>({
  localRow,
  mapLocalRowToRemote,
  markRowFailed,
  markRowSynced,
  upsertRemoteRow,
}: MapAndUpsertFromLocalPipelineProps<
  TLocalRow,
  TLocalRowInsert,
  TRemoteRow,
  TRemoteRowInsert
>): Promise<
  { isSuccessful: true } | { isSuccessful: false; error: string }
> => {
  try {
    const remotePayload = mapLocalRowToRemote(localRow);
    await upsertRemoteRow(remotePayload);
    await markRowSynced(localRow.id);
    return { isSuccessful: true };
  } catch (error) {
    await markRowFailed(localRow.id, getErrorMessage(error));
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const mergeAndUpsertFromLocalPipeline = async <
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
>({
  getRemoteRowByIdSafe,
  localRow,
  mapLocalRowToRemote,
  mapRemoteRowToLocal,
  markRowFailed,
  markRowSynced,
  upsertLocalRow,
  upsertRemoteRow,
}: MergeAndUpsertFromLocalPipelineProps<
  TLocalRow,
  TLocalRowInsert,
  TRemoteRow,
  TRemoteRowInsert
>): Promise<
  { isSuccessful: true } | { isSuccessful: false; error: string }
> => {
  try {
    const remotePayload = mapLocalRowToRemote(localRow);
    await upsertRemoteRow(remotePayload);
    const newRemoteRow = await getRemoteRowByIdSafe(localRow.id);
    if (!newRemoteRow) {
      throw new Error("remote refetch after upsert failed");
    }
    const localPayload = mapRemoteRowToLocal(newRemoteRow);
    await upsertLocalRow(localPayload);
    await markRowSynced(localRow.id);
    return { isSuccessful: true };
  } catch (error) {
    await markRowFailed(localRow.id, getErrorMessage(error));
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};
