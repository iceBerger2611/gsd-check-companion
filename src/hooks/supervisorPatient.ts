import {
  getProfileByIdSafe,
  ProfileRow,
} from "@/src/repos/local/profiles.repo";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { SyncStateAtom } from "./sync";

export const CurrentPatientAtom = atom<ProfileRow | null>(null);

export const useSyncSupervisorCurrentPatient = () => {
  const [currentPatient, setCurrentPatient] = useAtom(CurrentPatientAtom);
  const syncState = useAtomValue(SyncStateAtom);

  useEffect(() => {
    const fetchCurrentPatient = async () => {
      if (currentPatient) {
        const patientRes = await getProfileByIdSafe(currentPatient.id);
        if (patientRes) {
          setCurrentPatient(patientRes);
          return;
        }
      }
      setCurrentPatient(null);
    };

    fetchCurrentPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncState.lastSyncAt]);
};
