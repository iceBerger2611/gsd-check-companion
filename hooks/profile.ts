import { GetUserProfile } from "@/db/operations";
import supabase from "@/lib/supabase";
import { Profile } from "@/types/tables.types";
import { useEffect, useState } from "react";

export const useGetProfile = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true);
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (!id) return; // TODO: navigate to error
      const res = await GetUserProfile(id);
      if (!(res instanceof Error)) {
        setProfile(res);
      }
      setIsFetching(false);
    };

    if (!profile) {
      fetchProfile();
    }
  }, [profile]);

  return { profile, isFetching }
}