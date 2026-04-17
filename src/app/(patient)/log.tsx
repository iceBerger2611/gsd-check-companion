import ReadingForm from "@/src/components/ReadingForm";
import { useGetProfile } from "@/src/hooks/profile";
import { NotificationData } from "@/src/notifications/scheduler";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function Screen() {
  const { followup, followupId } =
    useLocalSearchParams<Partial<NotificationData>>();
  const { isFetching, profile: patient } = useGetProfile();

  return isFetching ? (
    <View>
      <Text>Loading Data...</Text>
      <ActivityIndicator animating />
    </View>
  ) : (
    <ReadingForm
      followup={followup ?? "recheck"}
      patientId={patient?.id ?? ""}
      sourceFollowupId={followupId}
    />
  );
}
