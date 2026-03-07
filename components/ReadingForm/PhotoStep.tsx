import { FollowupType } from "@/db/schema";
import { ReadingInsert } from "@/repos/readings.repo";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

const PhotoStep = ({
  followup,
  step,
  reading,
  setReading,
}: {
  followup: FollowupType;
  step: number;
  reading: ReadingInsert;
  setReading: (nextReading: ReadingInsert) => void;
}) => {
  const meterUrl = reading.meterPhotoUrl ?? "no photo taken";
  const cornstarchUrl = reading.cornstarchPhotoUrl ?? "no photo taken";

  return (
    <View
      style={{
        gap: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text variant="headlineSmall">Take a Photo of Your {followup === 'drink_cornstarch' ? 'Cornstarch' : 'Meter'}</Text>
      <View
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Button icon="camera" mode="contained" uppercase>
          TAKE PHOTO
        </Button>
        {<Text>{followup === 'recheck' ? meterUrl : cornstarchUrl}</Text>}
      </View>
    </View>
  );
};

export default PhotoStep;
