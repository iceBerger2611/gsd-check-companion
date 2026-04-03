import { mapDbError } from "@/db/errors";
import supabase from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { RemotePatientSettingsUpsertPayload } from "../utils";

export const upsertRemotePatientSettings = async (
  payload: RemotePatientSettingsUpsertPayload,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("patient_settings")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const fetchRemotePatientSettingsChangedSince = async (
  lastPulledAt: string | null,
): Promise<Database["public"]["Tables"]["patient_settings"]["Row"][]> => {
  try {
    let query = supabase
      .from("patient_settings")
      .select("*")
      .order("updated_at", { ascending: true });

    if (lastPulledAt) {
      query = query.gt("updated_at", lastPulledAt);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    throw mapDbError(error, "failed to fetch remote patient settings");
  }
};
