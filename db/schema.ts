import { sql } from "drizzle-orm";
import { sqliteTable, text, real, index, check } from "drizzle-orm/sqlite-core";

export type Intervention = "eat_immediately" | "consume_glucose";
export type FollowupType = "recheck" | "drink_cornstarch";

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

export type ThresholdRuleClassification =
  | "high"
  | "normal"
  | "low"
  | "critical";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  role: text("role"),
  displayName: text("display_name"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
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
    createdAt: text("created_at"),
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
    type: text("type"),
    dueAt: text("due_at"),
    status: text("status"),
    completedAt: text("completed_at"),
    photoPath: text("photo_path"),
    photoUrl: text("photo_url"),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
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
    patientId: text("patient_id").primaryKey().references(() => profiles.id, {
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