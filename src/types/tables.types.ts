import { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type Reading = Database["public"]["Tables"]["readings"]["Row"]

export type RuleConfig = Database["public"]["Tables"]["rule_configs"]["Row"]

export type CareLink = Database["public"]["Tables"]["care_links"]["Row"]

export type DeviceToken = Database["public"]["Tables"]["device_tokens"]["Row"]

export type ScheduleState = Database["public"]["Tables"]["schedule_state"]["Row"]