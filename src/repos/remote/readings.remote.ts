import { Database } from "@/src/types/database.types";
import { RemoteReadingUpsertPayload } from "../utils";
import supabase from "@/src/db/supabase";
import { mapDbError } from "@/src/db/errors";

export type RemoteReading = Database["public"]["Tables"]["readings"]["Row"];

export const getRemoteReadingByIdSafe = async (
  id: string,
): Promise<RemoteReading | null> => {
  try {
    const { data, error } = await supabase
      .from("readings")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.log(mapDbError(error, "falied to get reading"));
    return null;
  }
};

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
): Promise<RemoteReading[]> => {
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
