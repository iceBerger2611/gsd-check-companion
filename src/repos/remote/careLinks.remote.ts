import { mapDbError } from "@/db/errors";
import supabase from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { RemoteCareLinkUpsertPayload } from "../utils";

export type RemoteCareLink = Database["public"]["Tables"]["care_links"]["Row"];

export const getRemoteCareLinkByIdSafe = async (
  id: string,
): Promise<RemoteCareLink | null> => {
  try {
    const { data, error } = await supabase
      .from("care_links")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.log(mapDbError(error, "falied to get care link"));
    return null;
  }
};

export const upsertRemoteCareLink = async (
  payload: RemoteCareLinkUpsertPayload,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("care_links")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const fetchRemoteCareLinksChangedSince = async (
  lastPulledAt: string | null,
): Promise<RemoteCareLink[]> => {
  try {
    let query = supabase
      .from("care_links")
      .select("*")
      .order("updated_at", { ascending: true });

    if (lastPulledAt) {
      query = query.gt("updated_at", lastPulledAt);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    throw mapDbError(error, "failed to fetch remote care links");
  }
};
