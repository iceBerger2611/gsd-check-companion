import { DecisionType } from "@/db/schema";
import { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { StepFuncProps } from "./utils";

const EarlyDecisionStep = ({
  followup,
  currStep,
  reading,
  setReading,
  setEarlyDecision,
  earlyDecision,
}: StepFuncProps) => {
  const [currMinutes, setCurrMinutes] = useState<number | null>(
    reading.glucoseValue ?? null,
  );

  const onMinutesChange = (minutesValue: string) => {
    setCurrMinutes(Number(minutesValue));
  };

  const onAgree = () => {
    const interventionDecision: DecisionType = {
      type: "intervention",
      intervention: "eat_immediately",
    };
    const followupDecision: DecisionType = {
      type: "followup",
      followupType: "recheck",
      followupDelay: currMinutes || 0,
    };
    setEarlyDecision(
      followup === "recheck" ? interventionDecision : followupDecision,
    );
  };

  return (
    <View
      style={{
        gap: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {followup === "recheck" && (
        <Text variant="headlineSmall" style={{ alignContent: "space-between" }}>
          Would you like to eat immediately instead?
        </Text>
      )}
      {followup === "drink_cornstarch" && (
        <Text variant="headlineSmall">Would you like to recheck in:</Text>
      )}
      {followup === "drink_cornstarch" && (
        <TextInput
          inputMode="numeric"
          label="minutes"
          mode="outlined"
          style={{ width: "50%", height: "50%" }}
          onChangeText={onMinutesChange}
          value={currMinutes?.toString() || undefined}
        />
      )}
      {followup === "drink_cornstarch" && (
        <Text variant="headlineSmall">instead?</Text>
      )}
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
          justifyContent: "space-evenly",
        }}
      >
        <Button
          uppercase
          disabled={!!earlyDecision}
          onPress={onAgree}
          mode="outlined"
        >
          YES
        </Button>
        <Button
          uppercase
          disabled={!earlyDecision}
          onPress={() => setEarlyDecision(null)}
          mode="outlined"
        >
          NO
        </Button>
      </View>
      <Text>
        Current Decision:{" "}
        {!earlyDecision
          ? "none"
          : earlyDecision.type === "intervention"
            ? earlyDecision.intervention
            : `${earlyDecision.followupType} in ${earlyDecision.followupDelay} minutes`}
      </Text>
    </View>
  );
};

export default EarlyDecisionStep;
