import { GetUserProfile } from "@/db/operations";
import supabase from "@/lib/supabase";
import { Profile } from "@/types/tables.types";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { SyncStateAtom } from "./sync";

export const useGetProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const syncState = useAtomValue(SyncStateAtom);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true);
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (!id) {
        setIsFetching(false);
        return;
      }
      const res = await GetUserProfile(id);
      if (!(res instanceof Error)) {
        setProfile(res);
      }
      setIsFetching(false);
    };

    fetchProfile();
  }, [syncState.lastSyncAt]);

  return { profile, isFetching };
};
