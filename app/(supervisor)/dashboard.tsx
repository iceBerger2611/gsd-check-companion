import { GetPatientOfSupervisor } from "@/db/operations";
import { Profile } from "@/types/tables.types";
import { useSearchParams } from "expo-router/build/hooks";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function Screen() {
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchPatient = async (supervisorId: string) => {
      const res = await GetPatientOfSupervisor(supervisorId);
      if (!res || !(res instanceof Error)) {
        setPatient(res);
      }
    };
    const supervisorId = searchParams.get("id");
    if (supervisorId && !patient) {
      fetchPatient(supervisorId);
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
}