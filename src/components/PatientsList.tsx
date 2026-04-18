import { CurrentPatientAtom } from "@/src/hooks/supervisorPatient";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { View, ViewStyle } from "react-native";
import { List, Text } from "react-native-paper";
import { GetPatientsOfSupervisor } from "../db/authOperations";
import { UserProfileAtom } from "../hooks/profile";
import { ProfileRow } from "../repos/local/profiles.repo";

const selectedStyle: ViewStyle = {
  borderWidth: 2,
  borderColor: "blue",
  borderStyle: "solid",
  borderRadius: 8,
};

const PatientsList = () => {
  const profile = useAtomValue(UserProfileAtom);
  const [patients, setPatients] = useState<ProfileRow[]>([]);
  const [currentPatient, changeCurrentPatient] = useAtom(CurrentPatientAtom);

  useEffect(() => {
    const fetchPatients = async (supervisorId: string) => {
      const res = await GetPatientsOfSupervisor(supervisorId);
      if (!res || !(res instanceof Error)) {
        setPatients(res);
      }
    };

    if (profile) {
      fetchPatients(profile?.id);
    }
  }, [profile]);

  return (
    <List.Section style={{ gap: 10 }}>
      <View style={{ alignItems: "center" }}>
        <Text>{"( press on a patient to make it current )"}</Text>
      </View>
      {patients.map((patient) => {
        const isCurrentPatient = currentPatient?.id === patient.id;
        const title = `${patient.displayName || ""}${isCurrentPatient ? " - current" : ""}`;
        const style = isCurrentPatient && selectedStyle;

        const onPress = () => {
          if (isCurrentPatient) return;
          changeCurrentPatient(patient);
        };

        return (
          <List.Item
            key={patient.id}
            title={title}
            style={style}
            onPress={onPress}
          />
        );
      })}
    </List.Section>
  );
};

export default PatientsList;
