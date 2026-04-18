import { Router } from "expo-router";
import Toast from "react-native-toast-message";
import { GetPatientsOfSupervisor } from "../db/authOperations";
import { NotFoundError } from "../db/errors";
import supabase from "../db/supabase";
import { createAndGetNewPatientSettings } from "../hooks/settings";
import {
  getPatientSettingsById,
  PatientSettingsRow,
} from "../repos/local/patientSettings.repo";
import { getProfileById, ProfileRow } from "../repos/local/profiles.repo";
import { getErrorMessage } from "../repos/utils";
import { runSync } from "../syncEngine/syncService";

export const bootstrapAppSession = async (
  setUserProfile: (profile: ProfileRow | null) => void,
): Promise<
  | { isSuccessful: true; profile: ProfileRow }
  | { isSuccessful: false; error: string }
> => {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (id) {
    try {
      await getProfileById(id);
      await runSync();
      const refreshed = await getProfileById(id);
      setUserProfile(refreshed);
      return { isSuccessful: true, profile: refreshed };
    } catch (error) {
      await supabase.auth.signOut();
      return { isSuccessful: false, error: getErrorMessage(error) };
    }
  }
  return { isSuccessful: false, error: "session doesn't exist" };
};

export const bootstrapSupervisor = async (
  profileId: string,
  setCurrentPatient: (profile: ProfileRow | null) => void,
): Promise<
  | { isSuccessful: true; currentPatient: ProfileRow }
  | { isSuccessful: false; error: string }
> => {
  try {
    const res = await GetPatientsOfSupervisor(profileId);
    if (res instanceof Error) throw res;
    if (!res.length) {
      setCurrentPatient(null);
      return { isSuccessful: false, error: "No patients found for supervisor" };
    }
    setCurrentPatient(res[0]);
    return { isSuccessful: true, currentPatient: res[0] };
  } catch (error) {
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const bootstrapPatient = async (
  profileId: string,
  setPatientSettings: (settings: PatientSettingsRow | null) => void,
): Promise<
  | { isSuccessful: true; patientSettings: PatientSettingsRow }
  | { isSuccessful: false; error: string }
> => {
  try {
    const patientSettingsRes = await getPatientSettingsById(profileId);
    setPatientSettings(patientSettingsRes);
    return { isSuccessful: true, patientSettings: patientSettingsRes };
  } catch (error) {
    if (error instanceof NotFoundError) {
      try {
        const newPatientSettings =
          await createAndGetNewPatientSettings(profileId);
        if (newPatientSettings instanceof Error) throw newPatientSettings;
        await runSync();
        Toast.show({
          type: "success",
          text1: "new settings created successfuly!",
        });
        setPatientSettings(newPatientSettings);
        return { isSuccessful: true, patientSettings: newPatientSettings };
      } catch (error) {
        return { isSuccessful: false, error: getErrorMessage(error) };
      }
    }
    return { isSuccessful: false, error: getErrorMessage(error) };
  }
};

export const bootstrapApp = async (
  router: Router,
  setUserProfile: (profile: ProfileRow | null) => void,
  setPatientSettings: (settings: PatientSettingsRow | null) => void,
  setCurrentPatient: (profile: ProfileRow | null) => void,
) => {
  const sessionBootResult = await bootstrapAppSession(setUserProfile);
  if (!sessionBootResult.isSuccessful) {
    Toast.show({
      type: "error",
      text1: sessionBootResult.error,
    });
    router.navigate("/(auth)/login");
    return;
  }
  const profile = sessionBootResult.profile;
  if (profile.role === "supervisor") {
    const supervisorBootResult = await bootstrapSupervisor(
      profile.id,
      setCurrentPatient,
    );
    if (!supervisorBootResult.isSuccessful) {
      Toast.show({
        type: "error",
        text1: supervisorBootResult.error,
      });
    }
    router.navigate(`/(supervisor)/dashboard`);
  } else {
    const patientBootRes = await bootstrapPatient(
      profile.id,
      setPatientSettings,
    );
    if (!patientBootRes.isSuccessful) {
      Toast.show({
        type: "error",
        text1: patientBootRes.error,
      });
    }
    router.navigate(`/(patient)`);
  }
};
