import { Database } from "@/src/types/database.types";
import { RemoteThresholdRuleUpsertPayload } from "../utils";
import supabase from "@/src/db/supabase";
import { mapDbError } from "@/src/db/errors";

export type RemoteThresholdRule =
  Database["public"]["Tables"]["threshold_rules"]["Row"];

export const getRemoteThresholdRuleByIdSafe = async (
  id: string,
): Promise<RemoteThresholdRule | null> => {
  try {
    const { data, error } = await supabase
      .from("threshold_rules")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.log(mapDbError(error, "falied to get threshold rule"));
    return null;
  }
};

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
): Promise<RemoteThresholdRule[]> => {
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
