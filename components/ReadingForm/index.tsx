import { DecisionType, FollowupType } from "@/db/schema";
import { processReading } from "@/lib/readings";
import { ReadingInsert } from "@/repos/readings.repo";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import Toast from "react-native-toast-message";
import { getSteps, uploadURIToSupabase } from "./utils";

const ReadingForm = ({
  followup,
  patientId,
}: {
  followup: FollowupType;
  patientId: string;
}) => {
  const [currStep, setCurrStep] = useState(1);
  const [reading, setReading] = useState<ReadingInsert>({
    id: Crypto.randomUUID(),
    patientId,
  });
  const [earlyDecision, SetEarlyDecision] = useState<DecisionType | null>(null);

  const [photoUri, setPhotoUri] = useState<{
    cornstarch?: string;
    meter?: string;
  } | null>(null);

  const photoUriRef = useRef<{ cornstarch?: string; meter?: string } | null>(
    null,
  );

  const earlyDecisionRef = useRef<DecisionType | null>(null)

  const router = useRouter();

  useEffect(() => {
    photoUriRef.current = photoUri;
  }, [photoUri]);

  useEffect(() => {
    earlyDecisionRef.current = earlyDecision;
  }, [earlyDecision]);

  const onFinish = useCallback(
    async (reading: ReadingInsert) => {
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

      const latestPhotoUri = photoUriRef.current;
      const latestEarlyDecision = earlyDecisionRef.current

      const res = await processReading(reading, latestEarlyDecision);
      Toast.show({
        type: res instanceof Error ? "error" : "success",
        text1: res instanceof Error ? res.message : "Reading Saved",
      });

      if (
        !(res instanceof Error) &&
        latestPhotoUri?.cornstarch &&
        reading.cornstarchPhotoUrl
      ) {
        await uploadURIToSupabase(
          latestPhotoUri.cornstarch,
          reading.cornstarchPhotoUrl,
        );
      }

      if (
        !(res instanceof Error) &&
        latestPhotoUri?.meter &&
        reading.meterPhotoUrl
      ) {
        await uploadURIToSupabase(latestPhotoUri.meter, reading.meterPhotoUrl);
      }

      router.navigate(`/(patient)?id=${patientId}`);
    },
    [followup, patientId, router],
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
          setPhotoUri={setPhotoUri}
          followup={followup}
          setEarlyDecision={SetEarlyDecision}
          earlyDecision={earlyDecision}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ReadingForm;
