import { ErrorBoundaryProps, useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { UserProfileAtom } from "../hooks/profile";
import { PatientSettingsAtom } from "../hooks/settings";
import { CurrentPatientAtom } from "../hooks/supervisorPatient";
import { bootstrapAppSession } from "../lib/bootstrap";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "red" }}>
      <Text>{error.message}</Text>
      <Text onPress={retry}>Try Again?</Text>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const setProfile = useSetAtom(UserProfileAtom);
  const setPatientSettings = useSetAtom(PatientSettingsAtom);
  const setCurrentPatient = useSetAtom(CurrentPatientAtom);

  useEffect(() => {
    const handleEntry = async () => {
      await bootstrapAppSession(
        router,
        setProfile,
        setPatientSettings,
        setCurrentPatient,
      );
    };

    handleEntry();
  }, [router, setCurrentPatient, setPatientSettings, setProfile]);

  return null;
}
