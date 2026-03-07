import { FollowupType } from "@/db/schema";
import { ReadingInsert } from "@/repos/readings.repo";
import { useCallback, useMemo, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import Toast from "react-native-toast-message";
import { getSteps } from "./utils";

const ReadingForm = ({
  followup,
  patientId,
}: {
  followup: FollowupType;
  patientId: string;
}) => {
  const [currStep, setCurrStep] = useState(1);
  const [reading, setReading] = useState<ReadingInsert>({ id: "", patientId });

  const onFinish = useCallback(
    (reading: ReadingInsert) => {
      if (
        (followup === "recheck" && !reading.glucoseValue) ||
        (followup === "drink_cornstarch" && !reading.cornstarchPhotoUrl)
      ) {
        Toast.show({
          type: "error",
          text1: `No ${followup === "recheck" ? "Glucose Value" : "Cornstarch Photo"} Provided`,
        });
        return;
      }
      console.log(reading);
    },
    [followup],
  );

  const steps = useMemo(
    () => getSteps(followup, onFinish),
    [followup, onFinish],
  );

  const Step = steps[currStep - 1];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          gap: 60,
          justifyContent: "center",
        }}
      >
        <Step
          currStep={currStep}
          setCurrStep={setCurrStep}
          reading={reading}
          setReading={setReading}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ReadingForm;
