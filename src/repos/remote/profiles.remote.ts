import { mapDbError } from "@/db/errors";
import supabase from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { RemoteProfileUpsertPayload } from "../utils";

export type RemoteProfile = Database["public"]["Tables"]["profiles"]["Row"];

export const getRemoteProfileByIdSafe = async (
  id: string,
): Promise<RemoteProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.log(mapDbError(error, "falied to get profile"));
    return null;
  }
};

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
): Promise<RemoteProfile[]> => {
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
