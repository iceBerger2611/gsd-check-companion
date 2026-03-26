import { GetPatientsOfSupervisor } from "@/db/operations";
import { useEffect, useState } from "react";
import { useGetProfile } from "./profile";
import { ProfileRow } from "@/repos/local/profiles.repo";
import { atom, useAtom } from "jotai";

export const useSupervisorPatients = () => {
  const { profile } = useGetProfile();
  const [patients, setPatients] = useState<ProfileRow[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchPatients = async (supervisorId: string) => {
      setIsFetching(true);
      const res = await GetPatientsOfSupervisor(supervisorId);
      if (!res || !(res instanceof Error)) {
        setPatients(res);
      }
      setIsFetching(false);
    };

    if (profile) {
      fetchPatients(profile?.id);
    }
  }, [profile]);

  return { patients, isFetching };
};

export const SyncStateAtom = atom<ProfileRow | null>(null);

export const useSupervisorCurrentPatient = () => {
    const [currentPatient, setCurrentPatient] = useAtom(SyncStateAtom);
    const { patients } = useSupervisorPatients()

    const changeCurrentPatient = (patientId: string) => {
      const patient = patients.find(patient => patient.id === patientId)
      if (patient) {
        setCurrentPatient(patient)
        return patientId
      }
      return null
      
    }

    useEffect(() => {
      if (!currentPatient && patients.length) {
        setCurrentPatient(patients[0])
      }
    }, [currentPatient, patients, setCurrentPatient])

    return { currentPatient, changeCurrentPatient }
}
