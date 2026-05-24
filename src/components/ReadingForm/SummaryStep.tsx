import { View } from "react-native";
import { StepFuncProps } from "./utils";
import { Text } from "react-native-paper";

const SummaryStep = ({ currStep, earlyDecision, followup, reading,  }: StepFuncProps) => {
  return (
    <View
      style={{
        gap: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Blood Sugar Level: {reading.glucoseValue} mg/dL</Text>
    </View>
  );
};
