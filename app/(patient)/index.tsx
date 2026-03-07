import { GetUserProfile } from "@/db/operations";
import { Profile } from "@/types/tables.types";
import { useRouter, useSearchParams } from "expo-router/build/hooks";
import {} from "expo-sqlite";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

const PatientPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchPatient = async (id: string) => {
      const res = await GetUserProfile(id);
      if (!(res instanceof Error)) {
        setPatient(res);
      }
    };

    const id = searchParams.get("id");
    if (id && !patient) {
      fetchPatient(id);
    }
  }, [patient, searchParams]);

  return !patient ? (
    <View>
      <Text>no data yet</Text>
    </View>
  ) : (
    <View
      style={{
        flex: 1,
        paddingTop: 200,
        paddingHorizontal: 24,
        gap: 10,
        justifyContent: "flex-start",
      }}
    >
      <Text>patient name: {patient.display_name}</Text>
      <Text>patient id: {patient.id}</Text>
      <Button onPress={() => router.navigate(`/(patient)/log?followup=recheck&patientId=${patient.id}`)}>log</Button>
    </View>
  );
};

export default PatientPage;
