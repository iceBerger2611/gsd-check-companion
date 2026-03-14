import ReadingForm from "@/components/ReadingForm";
import { useGetProfile } from "@/hooks/profile";
import { NotificationData } from "@/notifications/scheduler";
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
