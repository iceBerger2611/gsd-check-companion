import {
  getPatientSettingsOfPatient,
  PatientSettingsRow,
  upsertPatientSettings,
} from "@/src/repos/local/patientSettings.repo";
import { createBasicPatientSettings } from "@/src/repos/utils";
import { runSync } from "@/src/syncEngine/syncService";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { useGetProfile } from "./profile";

export const usePatientSettings = () => {
  const { profile } = useGetProfile();
  const [shouldCreate, setShouldCreate] = useState(false);
  const [settings, setSettings] = useState<PatientSettingsRow | null>(null);

  useEffect(() => {
    const setCurrentPatientSettings = async (patientId: string) => {
      try {
        const res = await getPatientSettingsOfPatient(patientId);
        setSettings(res);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setShouldCreate(true);
      }
    };

    if (!settings && profile?.id && profile.role === "patient") {
      setCurrentPatientSettings(profile.id);
    }
  }, [profile?.id, profile?.role, settings]);

  useEffect(() => {
    const createPatientSettings = async (patientId: string) => {
      const patientSettings = createBasicPatientSettings(patientId);
      await upsertPatientSettings(patientSettings);
      const newPatientSettings = await getPatientSettingsOfPatient(patientId);
      setSettings(newPatientSettings);
      setShouldCreate(false);
      Toast.show({
        type: "success",
        text1: "New Settings Created!",
      });
      await runSync();
    };
    if (shouldCreate && !settings && profile?.id) {
      createPatientSettings(profile.id);
    }
  }, [profile?.id, settings, shouldCreate]);

  return { settings };
};
