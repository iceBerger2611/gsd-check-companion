import { DecisionType, FollowupType, Intervention } from "@/src/db/schema";
import { UserProfileAtom } from "@/src/hooks/profile";
import { PatientSettingsAtom } from "@/src/hooks/settings";
import { evaluateReading, ReadingPlan } from "@/src/processReading/utils";
import {
  listThresholdRulesByPatient,
  ThresholdRuleRow,
} from "@/src/repos/local/thresholdRules.repo";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { createValueLabel, getDecisionOptions, StepFuncProps } from "./utils";

const EarlyDecisionStep = ({
  followup,
  reading,
  setEarlyDecision,
  earlyDecision,
}: StepFuncProps) => {
  const patient = useAtomValue(UserProfileAtom);
  const settings = useAtomValue(PatientSettingsAtom);
  const [patientThresholds, setPatientThresholds] = useState<
    ThresholdRuleRow[] | null
  >(null);
  const [readingPlan, setReadingPlan] = useState<ReadingPlan | null>(null);
  const [currMinutes, setCurrMinutes] = useState<number | null>(0);

  const [decisionActionType, setDecisionActionType] = useState<
    Intervention | FollowupType | null
  >(
    !earlyDecision
      ? null
      : earlyDecision.type === "followup"
        ? earlyDecision.followupType
        : earlyDecision.intervention,
  );

  useEffect(() => {
    const fetchThresholds = async (patientId: string) => {
      const thresholds = await listThresholdRulesByPatient(patientId);
      if (!thresholds[0]) {
        return setPatientThresholds(null);
      } else {
        setPatientThresholds(thresholds);
      }
      return thresholds;
    };

    if (patient?.id) {
      fetchThresholds(patient.id);
    }
  }, [patient?.id]);

  useEffect(() => {
    if (patient?.id && patientThresholds?.length && settings && !readingPlan) {
      const newReadingPlan = evaluateReading(
        reading,
        patientThresholds,
        settings,
      );
      setReadingPlan(newReadingPlan);
    }
  }, [patient?.id, patientThresholds, reading, readingPlan, settings]);

  const decisionOptions = getDecisionOptions(followup);

  const calculateAndSetEarlyDecision = ({ actionType, minutes }: {
    actionType?: Intervention | FollowupType,
    minutes?: number,
  }) => {
    const decisionString = actionType ?? decisionActionType;
    const decisionMinutes = minutes ?? currMinutes;

    const interventionDecision: DecisionType = {
      type: "intervention",
      intervention: decisionString as Intervention,
    };
    const followupDecision: DecisionType = {
      type: "followup",
      followupType: decisionString as FollowupType,
      followupDelay: decisionMinutes || 0,
    };
    setEarlyDecision(
      decisionString === "recheck" || decisionString === "drink_cornstarch"
        ? followupDecision
        : interventionDecision,
    );
  };

  const onMinutesChange = (minutesValue: string) => {
    setCurrMinutes(Number(minutesValue));
    calculateAndSetEarlyDecision({ minutes: Number(minutesValue) });
  };

  const onDecisionChange = (
    value:
      | "recheck"
      | "drink_cornstarch"
      | "eat_immediately"
      | "consume_glucose",
  ) => {
    setDecisionActionType(value);
    calculateAndSetEarlyDecision({ actionType: value });
  };

  const onCancel = () => {
    setCurrMinutes(0);
    setDecisionActionType(null);
    setEarlyDecision(null);
  };

  return (
    <View
      style={{
        gap: 10,
        justifyContent: "center",
      }}
    >
      <Text variant="headlineSmall" style={{ alignContent: "space-between" }}>
        Do you want to change the next action?
      </Text>
      <Text>
        This will be used instead of what the system calculates for you
      </Text>
      <SegmentedButtons
        buttons={decisionOptions}
        value={followup}
        onValueChange={onDecisionChange}
      />
      <TextInput
        inputMode="numeric"
        label="minutes"
        mode="outlined"
        onChangeText={onMinutesChange}
        value={currMinutes?.toString() || undefined}
      />
      {readingPlan && (
        <>
          <Text>
            Expected by system:{" "}
            {
              createValueLabel(
                readingPlan.immediateIntervention ||
                  readingPlan.nexFollowup.type,
              ).label
            }{" "}
            {readingPlan.immediateIntervention &&
              `and ${readingPlan.immediateIntervention === "consume_glucose" ? "check" : "drink cornstarch"} `}
            in {readingPlan.nexFollowup.delayMinutes} minutes
          </Text>
          {decisionActionType && currMinutes && (
            <Text>
              Your choice: {createValueLabel(decisionActionType).label} in{" "}
              {currMinutes} minutes
            </Text>
          )}
        </>
      )}
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
          justifyContent: "space-evenly",
        }}
      >
        <Button uppercase onPress={onCancel} mode="outlined">
          <Text>CANCEL DECISION</Text>
        </Button>
      </View>
    </View>
  );
};

export default EarlyDecisionStep;
