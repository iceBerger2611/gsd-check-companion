import { FollowupType } from "@/db/schema";
import { ReadingInsert } from "@/repos/readings.repo";
import { View } from "react-native";
import { Button } from "react-native-paper";
import Animated, {
  LightSpeedInLeft,
  LightSpeedOutRight,
} from "react-native-reanimated";
import NumberStep from "./NumberStep";
import PhotoStep from "./PhotoStep";

export type StepFunc = React.FC<{
  reading: ReadingInsert;
  setReading: (nextReading: ReadingInsert) => void;
  setCurrStep: (nextStep: number) => void;
  currStep: number;
}>;

export const getSteps = (
  followup: FollowupType,
  onFinish: (reading: ReadingInsert) => void,
): StepFunc[] => {
  const steps: StepFunc[] = [];

  const amountOfSteps = followup === 'drink_cornstarch' ? 1 : 2

  for (let index = 0; index < amountOfSteps; index++) {
    const view = ({
      reading,
      setReading,
      setCurrStep,
      currStep,
    }: {
      reading: ReadingInsert;
      setReading: (nextReading: ReadingInsert) => void;
      setCurrStep: (nextStep: number) => void;
      currStep: number;
    }) => {
      const isLastStep = currStep === amountOfSteps;

      const SingleStep =
        currStep === 1 && followup === "recheck" ? NumberStep : PhotoStep;

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
            followup={followup}
            step={currStep}
            reading={reading}
            setReading={setReading}
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
