import { FollowupType } from "@/db/schema";
import { ReadingInsert } from "@/repos/readings.repo";
import { useState } from "react";
import { View } from "react-native";
import { Text, TextInput } from "react-native-paper";

const NumberStep = ({
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
  const [currGlucose, setCurrGlucose] = useState<number | null>(
    reading.glucoseValue ?? null,
  );

  const onGlucoseChange = (glucoseValue: string) => {
    const newReading: ReadingInsert = {
      ...reading,
      glucoseValue: Number(glucoseValue),
    };

    setCurrGlucose(Number(glucoseValue));
    setReading(newReading);
  };

  return (
    <View
      style={{
        gap: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text variant="headlineSmall">Enter Your Meters Reading</Text>
      <TextInput
        inputMode="numeric"
        label="glucose value"
        mode="outlined"
        style={{ width: "50%", height: "50%" }}
        onChangeText={onGlucoseChange}
        value={currGlucose?.toString() || undefined}
      />
    </View>
  );
};

export default NumberStep;
