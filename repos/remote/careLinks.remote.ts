import supabase from "@/lib/supabase";
import { RemoteCareLinkUpsertPayload } from "../utils";
import { Database } from "@/types/database.types";
import { mapDbError } from "@/db/errors";

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
): Promise<Database["public"]["Tables"]["care_links"]["Row"][]> => {
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
