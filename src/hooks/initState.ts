import { useSetAtom } from "jotai";
import { getPatientsOfSupervisor } from "../lib/bootstrap";
import { getPatientSettingsOfPatient } from "../repos/local/patientSettings.repo";
import { getProfileById } from "../repos/local/profiles.repo";
import { getErrorMessage } from "../repos/utils";
import { UserProfileAtom } from "./profile";
import { PatientSettingsAtom } from "./settings";
import { CurrentPatientAtom } from "./supervisorPatient";

export const useInitState = () => {
  const setProfile = useSetAtom(UserProfileAtom);
  const setPatientSettings = useSetAtom(PatientSettingsAtom);
  const setCurrentPatient = useSetAtom(CurrentPatientAtom);

  const initState = async (
    profileId: string,
    role: "patient" | "supervisor",
  ): Promise<
    { isSuccessful: true } | { isSuccessful: false; error: string }
  > => {
    try {
      const localProfile = await getProfileById(profileId);
      if (localProfile) setProfile(localProfile);
      if (role === "patient") {
        const localPatientSettings =
          await getPatientSettingsOfPatient(profileId);
        setPatientSettings(localPatientSettings);
        return { isSuccessful: true };
      } else {
        const res = await getPatientsOfSupervisor(profileId);
        if (!(res instanceof Error) && res.length) {
          setCurrentPatient(res[0]);
          return { isSuccessful: true };
        }
        return {
          isSuccessful: false,
          error: res instanceof Error ? res.message : "no patients found",
        };
      }
    } catch (error) {
      return { isSuccessful: false, error: getErrorMessage(error) };
    }
  };

  return initState;
};
