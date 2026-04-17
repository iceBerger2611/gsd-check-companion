import NextDue from "@/src/components/NextDue";
import RecentHistory from "@/src/components/RecentHistory";
import { ProfileRow } from "@/src/repos/local/profiles.repo";
import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

const Home = ({ patient, userName }: { patient: ProfileRow, userName: string }) => {
  return (
    <ScrollView
      contentContainerStyle={{
        justifyContent: "flex-start",
        paddingTop: 20,
        paddingHorizontal: 24,
        gap: 30,
      }}
    >
      <View style={{ gap: 10, justifyContent: "center" }}>
        <View style={{ alignItems: "center" }}>
          <Text variant="displaySmall">Hello, {userName}!</Text>
        </View>
      </View>
      <NextDue patientId={patient.id} />
      <RecentHistory patientId={patient.id} />
    </ScrollView>
  );
};

export default Home;
