import {
  getProfileByIdSafe,
  ProfileRow,
} from "@/src/repos/local/profiles.repo";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { SyncStateAtom } from "./sync";

export const UserProfileAtom = atom<ProfileRow | null>(null);

export const useProfileSync = () => {
  const syncState = useAtomValue(SyncStateAtom);
  const [profile, setProfile] = useAtom(UserProfileAtom);

  useEffect(() => {
    const fetchProfile = async (id: string) => {
      const res = await getProfileByIdSafe(id);
      if (res && !(res instanceof Error)) {
        setProfile(res);
      } else {
        setProfile(null);
      }
    };

    if (profile?.id) {
      fetchProfile(profile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncState.lastSyncAt]);
};
