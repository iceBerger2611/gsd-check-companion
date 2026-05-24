import { FollowupRow, getFollowupById } from "@/src/repos/local/followups.repo";
import {
  getReadingByIdSafe,
  ReadingRow,
} from "@/src/repos/local/readings.repo";
import { differenceInMinutes } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

export type ReadingOutcomeProps = {
  newReadingId: string;
  newFollowupId: string;
};

export default function Screen() {
  const [reading, setReading] = useState<ReadingRow | null>(null);
  const [followup, setFollowup] = useState<FollowupRow | null>(null);
  const [fetching, setFetching] = useState(false);
  const { newFollowupId, newReadingId } =
    useLocalSearchParams<Partial<ReadingOutcomeProps>>();

  const router = useRouter();

  useEffect(() => {
    const loadData = async (readingId: string, followupId: string) => {
      const readingRes = await getReadingByIdSafe(readingId);
      if (readingRes) {
        setReading(readingRes);
      }
      const followupRes = await getFollowupById(followupId);
      if (followupRes) {
        setFollowup(followupRes);
      }
    };

    if (newReadingId && newFollowupId) {
      setFetching(true);
      loadData(newReadingId, newFollowupId);
      setFetching(false);
    }
  }, [newFollowupId, newReadingId]);

  let content;

  if (!followup || !reading || fetching) {
    content = (
      <View>
        <Text>Loading Data...</Text>
        <ActivityIndicator animating />
      </View>
    );
  } else {
    const shouldShowMinutes = !!followup.dueAt;
    const minutesUntil =
      !!followup.dueAt &&
      differenceInMinutes(new Date(followup.dueAt), new Date());
    content = (
      <>
        <Text>Blood Sugar Level: {reading.glucoseValue} mg/dL</Text>
        <Text>
          Decision: {followup.type.split("_").join(" ")}{" "}
          {shouldShowMinutes
            ? Number(minutesUntil) === 0
              ? "now"
              : `in ${minutesUntil} minutes`
            : ""}
        </Text>
        <Text>
          {followup.scheduledNotificationIds.length} reminders scheduled
        </Text>
      </>
    );
  }

  if (!newFollowupId || !newReadingId) {
    content = <Text>Could Not Load Data Properly</Text>;
  }

  return (
    <View
      style={{
        gap: 30,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 100,
      }}
    >
      {content}
      <Button mode="contained" onPress={() => router.navigate("/(patient)")}>GO HOME</Button>
    </View>
  );
}
