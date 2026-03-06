import { GetUserProfile } from "@/db/operations";
import { Profile } from "@/types/tables.types";
import { useSearchParams } from "expo-router/build/hooks";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import {  } from "expo-sqlite"

const PatientPage = () => {
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchPatient = async (id: string) => {
      const res = await GetUserProfile(id);
      if (!res || !(res instanceof Error)) {
        setPatient(res);
      }
    };
    const id = searchParams.get("id");
    if (id && !patient) {
      fetchPatient(id);
    }
  }, [patient, searchParams]);

  return (
    !patient ? <View><Text>no data yet</Text></View> : (
      <View>
        <Text>patient name: {patient.display_name}</Text>
        <Text>patient id: {patient.id}</Text>
      </View>
    )
  );
};

export default PatientPage;
