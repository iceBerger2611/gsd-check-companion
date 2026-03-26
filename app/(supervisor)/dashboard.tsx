import Home from "@/components/Home";
import { useGetProfile } from "@/hooks/profile";
import { useSupervisorCurrentPatient } from "@/hooks/supervisorPatient";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function Screen() {
  const { profile } = useGetProfile();
  const { currentPatient } = useSupervisorCurrentPatient();

  return !currentPatient ? (
    <View>
      <Text>no data yet</Text>
    </View>
  ) : (
    <Home patient={currentPatient} userName={profile?.displayName || "there"} />
  );
}
