import supabase from "@/lib/supabase";
import { RemoteThresholdRuleUpsertPayload } from "../utils";
import { Database } from "@/types/database.types";
import { mapDbError } from "@/db/errors";

export const upsertRemoteThresholdRule = async (
  payload: RemoteThresholdRuleUpsertPayload,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("threshold_rules")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const fetchRemoteThresholdRulesChangedSince = async (
  lastPulledAt: string | null,
): Promise<Database["public"]["Tables"]["threshold_rules"]["Row"][]> => {
  try {
    let query = supabase
      .from("threshold_rules")
      .select("*")
      .order("updated_at", { ascending: true });

    if (lastPulledAt) {
      query = query.gt("updated_at", lastPulledAt);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    throw mapDbError(error, "failed to fetch remote threshold rules");
  }
};
