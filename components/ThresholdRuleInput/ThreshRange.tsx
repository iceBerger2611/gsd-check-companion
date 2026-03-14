import { useState } from "react";
import { View } from "react-native";
import { Text, TextInput } from "react-native-paper";

const ThreshRange = ({
  max,
  min,
  setMax,
  setMin,
}: {
  min: number | null;
  setMin: (min: number | null) => void;
  max: number | null;
  setMax: (max: number | null) => void;
}) => {
  const [currMin, setCurrMin] = useState(min);
  const [currMax, setCurrMax] = useState(max);

  const onMinChange = (min: string) => {
    const converted = Number(min);
    setCurrMin(converted);
    setMin(converted);
  };

  const onMaxChange = (max: string) => {
    const converted = Number(max);
    setCurrMax(converted);
    setMax(converted);
  };

  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: 'center' }}>
      <TextInput
        label="min value"
        inputMode="numeric"
        placeholder="enter minimum value"
        mode="outlined"
        value={currMin?.toString() || undefined}
        onChangeText={onMinChange}
        style={{ maxWidth: "50%" }}
      />
      <Text>To</Text>
      <TextInput
        label="max value"
        inputMode="numeric"
        placeholder="enter maximum value"
        mode="outlined"
        value={currMax?.toString() || undefined}
        onChangeText={onMaxChange}
        style={{ maxWidth: "50%" }}
      />
    </View>
  );
};

export default ThreshRange;
