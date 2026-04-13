import { mapDbError } from "@/db/errors";
import supabase from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { RemoteFollowupUpsertPayload } from "../utils";

export type RemoteFollowup = Database["public"]["Tables"]["followups"]["Row"];

export const getRemoteFollowupByIdSafe = async (
  id: string,
): Promise<RemoteFollowup | null> => {
  try {
    const { data, error } = await supabase
      .from("followups")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.log(mapDbError(error, "falied to get followup"));
    return null;
  }
};

export const upsertRemoteFollowup = async (
  payload: RemoteFollowupUpsertPayload,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("followups")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const fetchRemoteFollowupsChangedSince = async (
  lastPulledAt: string | null,
): Promise<RemoteFollowup[]> => {
  try {
    let query = supabase
      .from("followups")
      .select("*")
      .order("updated_at", { ascending: true });

    if (lastPulledAt) {
      query = query.gt("updated_at", lastPulledAt);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    throw mapDbError(error, "failed to fetch remote followups");
  }
};
