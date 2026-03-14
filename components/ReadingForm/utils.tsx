import { DecisionType, FollowupType, Intervention } from "@/db/schema";
import supabase from "@/lib/supabase";
import { ReadingInsert } from "@/repos/readings.repo";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { View } from "react-native";
import { Button } from "react-native-paper";
import Animated, {
  LightSpeedInLeft,
  LightSpeedOutRight,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import CornPhotoStep from "./CornPhotoStep";
import EarlyDecisionStep from "./EarlyDecisionStep";
import MeterPhotoStep from "./MeterPhotoStep";
import NumberStep from "./NumberStep";

export type StepFuncProps = {
  followup: FollowupType;
  reading: ReadingInsert;
  setReading: (nextReading: ReadingInsert) => void;
  setCurrStep: (nextStep: number) => void;
  currStep: number;
  setPhotoUri: (nextUri: { cornstarch?: string; meter?: string }) => void;
  setEarlyDecision: (nextDecision: DecisionType | null) => void;
  earlyDecision: DecisionType | null;
};

export type StepFunc = React.FC<StepFuncProps>;

export const validateLog = (
  reading: ReadingInsert,
  followup: FollowupType,
  earlyDecision: DecisionType | null,
): { isValid: boolean; error?: string } => {
  let isValid = true;
  const missingValues: string[] = [];

  if (followup === "recheck" && !reading.glucoseValue && !earlyDecision) {
    missingValues.push("Glucose Value");
    isValid = false;
  }

  if (
    followup === "drink_cornstarch" &&
    !reading.cornstarchPhotoUrl &&
    !earlyDecision
  ) {
    missingValues.push("Cornstarch Photo");
    isValid = false;
  }

  if (
    followup === "recheck" &&
    earlyDecision?.type === "followup" &&
    earlyDecision.followupType === "drink_cornstarch" &&
    !reading.cornstarchPhotoUrl
  ) {
    missingValues.push("Cornstarch Photo");
    isValid = false;
  }

  return {
    isValid,
    ...(missingValues.length && { error: missingValues.join(", ") }),
  };
};

export const createValueLabel = (value: Intervention | FollowupType) => {
  const splitValue = value.split("_");
  const label = splitValue.reduce<string>((prev, curr, index) => {
    if (!curr) return prev;
    const capitalCurr = curr.charAt(0).toUpperCase() + curr.slice(1);
    return `${prev}${index === 0 ? "" : " "}${capitalCurr}`;
  }, "");
  return { value, label };
};

export const getDecisionOptions = (
  followup: FollowupType,
): { label: string; value: Intervention | FollowupType }[] => {
  const decisionOptions: {
    label: string;
    value: Intervention | FollowupType;
  }[] = [];
  decisionOptions.push(createValueLabel("consume_glucose"));
  decisionOptions.push(createValueLabel("eat_immediately"));
  if (followup === "recheck") {
    decisionOptions.push(createValueLabel("drink_cornstarch"));
  }
  if (followup === "drink_cornstarch") {
    decisionOptions.push(createValueLabel("recheck"));
  }

  return decisionOptions;
};

export const createPhotoPath = (
  reading: ReadingInsert,
  followup: FollowupType,
) => {
  const userId = reading.patientId;
  const readingId = reading.id;
  const photoType = followup === "drink_cornstarch" ? "cornstarch" : "meter";
  const timestamp = Date.now();
  return `${userId}/${readingId}/${photoType}/${timestamp}.jpg`;
};

export const uploadURIToSupabase = async (uri: string, path: string) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const fileExt = uri.split(".").pop()?.toLowerCase() ?? "jpg";

  const { error } = await supabase.storage
    .from("intervention-photos")
    .upload(path, arrayBuffer, {
      contentType: fileExt === "png" ? "image/png" : "image/jpeg",
      upsert: false,
    });
  Toast.show({
    type: error ? "error" : "success",
    text1: error ? error.message : "Photo Uploaded successfuly",
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

export const getSteps = (
  followup: FollowupType,
  onFinish: (reading: ReadingInsert) => void,
): StepFunc[] => {
  const stepfunctions: StepFunc[] = [];

  const layoutSteps: StepFunc[] = [
    MeterPhotoStep,
    CornPhotoStep,
    EarlyDecisionStep,
  ];

  if (followup === "recheck") layoutSteps.unshift(NumberStep);

  const amountOfSteps = layoutSteps.length;

  layoutSteps.forEach((Step, index) => {
    const view = ({
      reading,
      setReading,
      setCurrStep,
      currStep,
      setPhotoUri,
      setEarlyDecision,
      earlyDecision,
    }: StepFuncProps) => {
      const isLastStep = currStep === amountOfSteps;

      return (
        <Animated.View
          key={`step-${index + 1}`}
          entering={LightSpeedInLeft}
          exiting={LightSpeedOutRight}
          style={{
            borderWidth: 1,
            borderColor: "black",
            borderStyle: "solid",
            borderRadius: 8,
            height: "60%",
            gap: 50,
            padding: 24,
          }}
        >
          <Step
            earlyDecision={earlyDecision}
            followup={followup}
            currStep={currStep}
            reading={reading}
            setReading={setReading}
            setPhotoUri={setPhotoUri}
            setCurrStep={setCurrStep}
            setEarlyDecision={setEarlyDecision}
          />
          <View style={{ flex: 1 }} />
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 10,
              justifyContent: "space-evenly",
            }}
          >
            {currStep > 1 && (
              <Button
                uppercase
                mode="outlined"
                onPress={() => setCurrStep(currStep - 1)}
              >
                back
              </Button>
            )}
            <Button
              uppercase
              mode="outlined"
              onPress={() =>
                isLastStep
                  ? onFinish({ ...reading, createdAt: new Date().toString() })
                  : setCurrStep(currStep + 1)
              }
            >
              {isLastStep ? "finish" : "next"}
            </Button>
          </View>
        </Animated.View>
      );
    };

    stepfunctions.push(view);
  });
  return stepfunctions;
};
