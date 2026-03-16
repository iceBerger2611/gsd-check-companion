import supabase from "@/lib/supabase";
import { RemoteFollowupUpsertPayload } from "../utils";
import { Database } from "@/types/database.types";
import { mapDbError } from "@/db/errors";

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
): Promise<Database["public"]["Tables"]["followups"]["Row"][]> => {
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
