import {
  getPatientSettingsByIdSafe,
  getPatientSettingsOfPatient,
  PatientSettingsRow,
  upsertPatientSettings,
} from "@/src/repos/local/patientSettings.repo";
import { createBasicPatientSettings, getErrorMessage } from "@/src/repos/utils";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { SyncStateAtom } from "./sync";
import { UserProfileAtom } from "./profile";

export const PatientSettingsAtom = atom<PatientSettingsRow | null>(null);

export const createAndGetNewPatientSettings = async (
  patientId: string,
): Promise<PatientSettingsRow | Error> => {
  try {
    const patientSettings = createBasicPatientSettings(patientId);
    await upsertPatientSettings(patientSettings);
    const newPatientSettings = await getPatientSettingsOfPatient(patientId);
    return newPatientSettings;
  } catch (error) {
    Toast.show({
      type: "error",
      text1: getErrorMessage(error),
    });
    return error as Error;
  }
};

export const useSyncPatientSettings = () => {
  const syncState = useAtomValue(SyncStateAtom);
  const setSettings = useSetAtom(PatientSettingsAtom);
  const profile = useAtomValue(UserProfileAtom)

  useEffect(() => {
    const fetchSettings = async (id: string) => {
      const res = await getPatientSettingsByIdSafe(id);
      if (res && !(res instanceof Error)) {
        setSettings(res);
      } else {
        setSettings(null);
      }
    };

    if (profile?.id) {
      fetchSettings(profile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncState.lastSyncAt]);
};
