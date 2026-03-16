import supabase from "@/lib/supabase";
import { RemoteProfileUpsertPayload } from "../utils";
import { Database } from "@/types/database.types";
import { mapDbError } from "@/db/errors";

export const upsertRemoteProfile = async (
  payload: RemoteProfileUpsertPayload,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const fetchRemoteProfilesChangedSince = async (
  lastPulledAt: string | null,
): Promise<Database["public"]["Tables"]["profiles"]["Row"][]> => {
  try {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: true });

    if (lastPulledAt) {
      query = query.gt("updated_at", lastPulledAt);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    throw mapDbError(error, "failed to fetch remote profiles");
  }
};
