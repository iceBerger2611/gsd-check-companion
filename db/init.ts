import { db } from "./client";

export async function resetLocalDB() {
  await db.run(`PRAGMA foreign_keys = OFF;`);

  await db.run(`DROP TABLE IF EXISTS followups;`);
  await db.run(`DROP TABLE IF EXISTS threshold_rules;`);
  await db.run(`DROP TABLE IF EXISTS schedule_state;`);
  await db.run(`DROP TABLE IF EXISTS readings;`);
  await db.run(`DROP TABLE IF EXISTS device_tokens;`);
  await db.run(`DROP TABLE IF EXISTS care_links;`);
  await db.run(`DROP TABLE IF EXISTS profiles;`);
  await db.run(`DROP TABLE IF EXISTS rule_configs;`);

  await db.run(`PRAGMA foreign_keys = ON;`);

  await initLocalDB();
}

export async function initLocalDB() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      role TEXT,
      display_name TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS care_links (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      supervisor_id TEXT,
      status TEXT,
      created_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (supervisor_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS device_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      expo_push_token TEXT,
      platform TEXT,
      device_label TEXT,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      recorded_at TEXT,
      glucose_value REAL,
      unit TEXT,
      outcome TEXT,
      note TEXT,
      meter_photo_url TEXT,
      cornstarch_photo_url TEXT,
      evaluated_decision TEXT,
      final_decision TEXT,
      was_overridden INTEGER NOT NULL DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS followups (
      id TEXT PRIMARY KEY,
      reading_id TEXT,
      patient_id TEXT,
      type TEXT NOT NULL CHECK (type IN ('recheck','drink_cornstarch')),
      scheduled_notification_ids TEXT NOT NULL DEFAULT '[]',
      due_at TEXT,
      status TEXT,
      completed_at TEXT,
      photo_path TEXT,
      photo_url TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS schedule_state (
      patient_id TEXT PRIMARY KEY,
      last_reading_at TEXT,
      last_value REAL,
      last_outcome TEXT,
      next_due_at TEXT,
      overdue_since TEXT,
      last_notified_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS threshold_rules (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      label TEXT,
      min_value REAL,
      max_value REAL,
      classification TEXT CHECK (
        classification IN ('high', 'normal', 'low', 'critical')
      ),
      actions TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE CASCADE,
      CHECK (min_value IS NOT NULL OR max_value IS NOT NULL),
      CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
    );
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_care_links_patient_id
    ON care_links(patient_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_care_links_supervisor_id
    ON care_links(supervisor_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id
    ON device_tokens(user_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_readings_patient_id
    ON readings(patient_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_readings_recorded_at
    ON readings(recorded_at);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_followups_reading_id
    ON followups(reading_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_followups_patient_id
    ON followups(patient_id);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_followups_due_at
    ON followups(due_at);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_followups_status
    ON followups(status);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_schedule_state_next_due_at
    ON schedule_state(next_due_at);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_threshold_rules_patient_id
    ON threshold_rules(patient_id);
  `);
}
