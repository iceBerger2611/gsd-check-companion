import Home from "@/src/components/Home";
import { UserProfileAtom } from "@/src/hooks/profile";
import { CurrentPatientAtom } from "@/src/hooks/supervisorPatient";
import { useAtomValue } from "jotai";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function Screen() {
  const profile = useAtomValue(UserProfileAtom);
  const currentPatient = useAtomValue(CurrentPatientAtom);

  return !currentPatient ? (
    <View>
      <Text>no data yet</Text>
    </View>
  ) : (
    <Home patient={currentPatient} userName={profile?.displayName || "there"} />
  );
}
