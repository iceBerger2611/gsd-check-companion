export type BasicLocalEntityShape = {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  syncStatus: string;
};

export type BasicLocalInsertEntityShape = {
  id?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
};

export type BasicRemoteEntityShape = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BasicRemoteInsertEntityShape = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type ReconcileResult<TLocal> =
  | { action: "apply_remote" }
  | { action: "keep_local" }
  | { action: "write_merged_local"; row: TLocal }
  | { action: "mark_conflict"; reason: string };

export type ResolveConflictArgs<TRemote, TLocal> = {
  remoteUpdatedAt?: string | null;
  localUpdatedAt?: string | null;
  remote?: TRemote;
  local?: TLocal;
};

export type FieldPair<TLocal, TRemote> = {
  localKey: keyof TLocal;
  remoteKey: keyof TRemote;
  equals?: (localValue: unknown, remoteValue: unknown) => boolean;
};

export type ResolveConflictFn<TRemote, TLocal> = (
  args: ResolveConflictArgs<TRemote, TLocal>,
) => ReconcileResult<TLocal>;

export type PushPendingResult = {
  attempted: number;
  succeeded: number;
  failed: number;
};

export type PullResult = {
  attempted: number;
  pullSucceeded: number;
  pullFailed: number;
  pullNotApplied: number;
};

export type PushPendingRowOptions<
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
> = {
  listPendingRows: () => Promise<TLocalRow[]>;
  getRemoteRowByIdSafe: (id: string) => Promise<TRemoteRow | null>;
  conflictResolver: ResolveConflictFn<TRemoteRow, TLocalRow>;
  mapLocalRowToRemote: (row: TLocalRow) => TRemoteRowInsert;
  mapRemoteRowToLocal: (row: TRemoteRow) => TLocalRowInsert;
  upsertLocalRow: (row: TLocalRowInsert) => Promise<void>;
  upsertRemoteRow: (row: TRemoteRowInsert) => Promise<void>;
  markRowSynced: (id: string) => Promise<void>;
  markRowFailed: (id: string, error: string) => Promise<void>;
};

export type PullRowsOptions<
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
> = {
  syncCursorKey: string;
  fetchRemoteRowsChangedSince: (
    lastPulledAt: string | null,
  ) => Promise<TRemoteRow[]>;
  getRowByIdSafe: (id: string) => Promise<TLocalRow | null>;
  getRemoteRowByIdSafe: (id: string) => Promise<TRemoteRow | null>;
  conflictResolver: ResolveConflictFn<TRemoteRow, TLocalRow>;
  mapLocalRowToRemote: (row: TLocalRow) => TRemoteRowInsert;
  mapRemoteRowToLocal: (row: TRemoteRow) => TLocalRowInsert;
  upsertLocalRow: (row: TLocalRowInsert) => Promise<void>;
  upsertRemoteRow: (row: TRemoteRowInsert) => Promise<void>;
  markRowFailed: (id: string, error: string) => Promise<void>;
  markRowSynced: (id: string) => Promise<void>;
};

export type MapAndUpsertFromRemotePipelineProps<
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
> = Pick<
  PushPendingRowOptions<
    TLocalRow,
    TLocalRowInsert,
    TRemoteRow,
    TRemoteRowInsert
  >,
  "mapRemoteRowToLocal" | "upsertLocalRow" | "markRowSynced" | "markRowFailed"
> & { localRow: TLocalRow; remoteRow: TRemoteRow };

export type MapAndUpsertFromLocalPipelineProps<
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
> = Pick<
  PushPendingRowOptions<
    TLocalRow,
    TLocalRowInsert,
    TRemoteRow,
    TRemoteRowInsert
  >,
  "mapLocalRowToRemote" | "upsertRemoteRow" | "markRowSynced" | "markRowFailed"
> & { localRow: TLocalRow };

export type MergeAndUpsertFromLocalPipelineProps<
  TLocalRow extends BasicLocalEntityShape,
  TLocalRowInsert extends BasicLocalInsertEntityShape,
  TRemoteRow extends BasicRemoteEntityShape,
  TRemoteRowInsert extends BasicRemoteInsertEntityShape,
> = Pick<
  PushPendingRowOptions<
    TLocalRow,
    TLocalRowInsert,
    TRemoteRow,
    TRemoteRowInsert
  >,
  | "mapLocalRowToRemote"
  | "upsertRemoteRow"
  | "getRemoteRowByIdSafe"
  | "mapRemoteRowToLocal"
  | "upsertLocalRow"
  | "markRowSynced"
  | "markRowFailed"
> & { localRow: TLocalRow };
