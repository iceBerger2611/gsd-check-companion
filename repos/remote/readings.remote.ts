import supabase from "@/lib/supabase";
import { RemoteReadingUpsertPayload } from "../utils";
import { Database } from "@/types/database.types";
import { mapDbError } from "@/db/errors";

export const upsertRemoteReading = async (
  payload: RemoteReadingUpsertPayload,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("readings")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const fetchRemoteReadingsChangedSince = async (
  lastPulledAt: string | null,
): Promise<Database["public"]["Tables"]["readings"]["Row"][]> => {
  try {
    let query = supabase
      .from("readings")
      .select("*")
      .order("updated_at", { ascending: true });

    if (lastPulledAt) {
      query = query.gt("updated_at", lastPulledAt);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    throw mapDbError(error, "failed to fetch remote readings");
  }
};
