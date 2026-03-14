import { DecisionType, FollowupType, Intervention } from "@/db/schema";
import { useState } from "react";
import { View } from "react-native";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { createValueLabel, getDecisionOptions, StepFuncProps } from "./utils";

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

  const [decisionActionType, setDecisionActionType] = useState<
    Intervention | FollowupType | null
  >(
    !earlyDecision
      ? null
      : earlyDecision.type === "followup"
        ? earlyDecision.followupType
        : earlyDecision.intervention,
  );

  const decisionOptions = getDecisionOptions(followup);

  const onMinutesChange = (minutesValue: string) => {
    setCurrMinutes(Number(minutesValue));
  };

  const onAgree = () => {
    const interventionDecision: DecisionType = {
      type: "intervention",
      intervention: decisionActionType as Intervention,
    };
    const followupDecision: DecisionType = {
      type: "followup",
      followupType: decisionActionType as FollowupType,
      followupDelay: decisionActionType === 'drink_cornstarch' ? 180 : currMinutes || 0,
    };
    setEarlyDecision(
      decisionActionType === "recheck" ||
        decisionActionType === "drink_cornstarch"
        ? followupDecision
        : interventionDecision,
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
      <Text variant="headlineSmall" style={{ alignContent: "space-between" }}>
        Would you like to:
      </Text>
      <SegmentedButtons
        buttons={decisionOptions}
        value={followup}
        onValueChange={(value) => setDecisionActionType(value)}
      />
      {decisionActionType === "recheck" && (
        <TextInput
          inputMode="numeric"
          label="minutes"
          mode="outlined"
          style={{ width: "50%", height: "50%" }}
          onChangeText={onMinutesChange}
          value={currMinutes?.toString() || undefined}
        />
      )}
      <Text variant="headlineSmall">instead?</Text>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
          justifyContent: "space-evenly",
        }}
      >
        <Button uppercase onPress={onAgree} mode="outlined">
          YES
        </Button>
        <Button
          uppercase
          onPress={() => setEarlyDecision(null)}
          mode="outlined"
        >
          NO
        </Button>
      </View>
      <Text>
        Current Decision:{" "}
        {!decisionActionType
          ? "none"
          : createValueLabel(decisionActionType).label}
      </Text>
    </View>
  );
};

export default EarlyDecisionStep;
