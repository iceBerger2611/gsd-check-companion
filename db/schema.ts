import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const SyncCursorKeys = {
  profiles: "profiles_last_pull",
  careLinks: "care_links_last_pull",
  thresholdRules: "threshold_rules_last_pull",
  readings: "readings_last_pull",
  followups: "followups_last_pull",
  patientSettings: "patient_settings_last_pull"
} as const;

export const SYNC_STATUS = {
  PENDING: "pending",
  SYNCED: "synced",
  FAILED: "failed",
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

export const interventions = ["eat_immediately", "consume_glucose"] as const;

export type Intervention = (typeof interventions)[number];

export const followupTypes = ["recheck", "drink_cornstarch"] as const;
export type FollowupType = (typeof followupTypes)[number];

export type Action =
  | {
      type: "intervention";
      intervention: Intervention;
    }
  | {
      type: "followup";
      followupType: FollowupType;
      followupDelay: number;
    };

//export type DecisionType = FollowupType | "none"; --before
export type DecisionType = Action | null; //--now

export type ThresholdRuleClassification =
  | "high"
  | "normal"
  | "low"
  | "critical";

// export type PatientSettings = {
//   id: string;
//   patientId: string;
//   followupSpacingMinutes: number; // basically the time between cornstarch followups
//   notificationSpacingMinutes: number;
//   notificationCount: number;
//   notificationWindowOverride: {
//     windowStartMinuteOfDay: number;
//     windowEndMinuteofDay: number;
//     windowNotificationSpacingMinutes: number;
//     windowNotificationCount: number;
//   } | null;
//   createdAt: string | null;
//   updatedAt: string | null;
//   deletedAt: string | null;
//   syncStatus: string;
//   lastSyncedAt: string | null;
//   syncError: string | null;
// };

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  role: text("role"),
  displayName: text("display_name"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  deletedAt: text("deleted_at"),
  syncStatus: text("sync_status").notNull().default("pending"),
  lastSyncedAt: text("last_synced_at"),
  syncError: text("sync_error"),
});

export const careLinks = sqliteTable(
  "care_links",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    supervisorId: text("supervisor_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    status: text("status"),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    lastSyncedAt: text("last_synced_at"),
    syncError: text("sync_error"),
  },
  (table) => ({
    patientIdx: index("idx_care_links_patient_id").on(table.patientId),
    supervisorIdx: index("idx_care_links_supervisor_id").on(table.supervisorId),
  }),
);

export const deviceTokens = sqliteTable(
  "device_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    expoPushToken: text("expo_push_token"),
    platform: text("platform"),
    deviceLabel: text("device_label"),
    updatedAt: text("updated_at"),
  },
  (table) => ({
    userIdx: index("idx_device_tokens_user_id").on(table.userId),
  }),
);

export const readings = sqliteTable(
  "readings",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    recordedAt: text("recorded_at"),
    glucoseValue: real("glucose_value"),
    unit: text("unit"),
    outcome: text("outcome"),
    note: text("note"),
    meterPhotoUrl: text("meter_photo_url"),
    cornstarchPhotoUrl: text("cornstarch_photo_url"),
    evaluatedDecision: text("evaluated_decision", {
      mode: "json",
    }).$type<Action | null>(),
    finalDecision: text("final_decision", {
      mode: "json",
    }).$type<Action | null>(),
    wasOverridden: integer("was_overridden", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    lastSyncedAt: text("last_synced_at"),
    syncError: text("sync_error"),
  },
  (table) => ({
    patientIdx: index("idx_readings_patient_id").on(table.patientId),
    recordedAtIdx: index("idx_readings_recorded_at").on(table.recordedAt),
  }),
);

export const followups = sqliteTable(
  "followups",
  {
    id: text("id").primaryKey(),
    readingId: text("reading_id").references(() => readings.id, {
      onDelete: "cascade",
    }),
    patientId: text("patient_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    type: text("type", { enum: followupTypes }).$type<FollowupType>().notNull(),
    scheduledNotificationIds: text("scheduled_notification_ids", {
      mode: "json",
    })
      .$type<string[]>()
      .notNull(),
    dueAt: text("due_at"),
    status: text("status"),
    completedAt: text("completed_at"),
    photoPath: text("photo_path"),
    photoUrl: text("photo_url"),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    lastSyncedAt: text("last_synced_at"),
    syncError: text("sync_error"),
  },
  (table) => ({
    readingIdx: index("idx_followups_reading_id").on(table.readingId),
    patientIdx: index("idx_followups_patient_id").on(table.patientId),
    dueAtIdx: index("idx_followups_due_at").on(table.dueAt),
    statusIdx: index("idx_followups_status").on(table.status),
  }),
);

export const scheduleState = sqliteTable(
  "schedule_state",
  {
    patientId: text("patient_id")
      .primaryKey()
      .references(() => profiles.id, {
        onDelete: "cascade",
      }),
    lastReadingAt: text("last_reading_at"),
    lastValue: real("last_value"),
    lastOutcome: text("last_outcome"),
    nextDueAt: text("next_due_at"),
    overdueSince: text("overdue_since"),
    lastNotifiedAt: text("last_notified_at"),
    updatedAt: text("updated_at"),
  },
  (table) => ({
    nextDueAtIdx: index("idx_schedule_state_next_due_at").on(table.nextDueAt),
  }),
);

export const thresholdRules = sqliteTable(
  "threshold_rules",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    label: text("label"),
    minValue: real("min_value"),
    maxValue: real("max_value"),
    classification: text("classification").$type<ThresholdRuleClassification>(),
    actions: text("actions", { mode: "json" }).$type<Action[]>(),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    lastSyncedAt: text("last_synced_at"),
    syncError: text("sync_error"),
  },
  (table) => ({
    patientIdx: index("idx_threshold_rules_patient_id").on(table.patientId),
    classificationCheck: check(
      "threshold_rules_classification_check",
      sql`${table.classification} in ('high', 'normal', 'low', 'critical')`,
    ),
    atLeastOneBoundCheck: check(
      "threshold_rules_at_least_one_bound_check",
      sql`${table.minValue} is not null or ${table.maxValue} is not null`,
    ),
    minLteMaxCheck: check(
      "threshold_rules_min_lte_max_check",
      sql`${table.minValue} is null or ${table.maxValue} is null or ${table.minValue} <= ${table.maxValue}`,
    ),
  }),
);

export const syncState = sqliteTable("sync_state", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at").notNull(),
});

export const patientSettings = sqliteTable("patient_settings", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),

  followupSpacingMinutes: integer("followup_spacing_minutes").notNull(),
  notificationSpacingMinutes: integer("notification_spacing_minutes").notNull(),
  notificationCount: integer("notification_count").notNull(),

  windowStartMinuteOfDay: integer("window_start_minute_of_day"),
  windowEndMinuteOfDay: integer("window_end_minute_of_day"),
  windowNotificationSpacingMinutes: integer("window_notification_spacing_minutes"),
  windowNotificationCount: integer("window_notification_count"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),

  syncStatus: text("sync_status").notNull().default("synced"),
  lastSyncedAt: text("last_synced_at"),
  syncError: text("sync_error"),
});