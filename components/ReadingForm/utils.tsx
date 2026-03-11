import { DecisionType, FollowupType } from "@/db/schema";
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
import EarlyDecisionStep from "./EarlyDecisionStep";
import NumberStep from "./NumberStep";
import PhotoStep from "./PhotoStep";

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
  const steps: StepFunc[] = [];

  const amountOfSteps = followup === "drink_cornstarch" ? 2 : 3;

  for (let index = 0; index < amountOfSteps; index++) {
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

      const SingleStep =
        currStep === amountOfSteps
          ? EarlyDecisionStep
          : currStep === 1 && followup === "recheck"
            ? NumberStep
            : PhotoStep;

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
          <SingleStep
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
                isLastStep ? onFinish(reading) : setCurrStep(currStep + 1)
              }
            >
              {isLastStep ? "finish" : "next"}
            </Button>
          </View>
        </Animated.View>
      );
    };

    steps.push(view);
  }

  return steps;
};
