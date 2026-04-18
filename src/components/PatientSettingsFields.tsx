import { PatientSettingsAtom } from "@/src/hooks/settings";
import { upsertPatientSettings } from "@/src/repos/local/patientSettings.repo";
import { ProfileRow } from "@/src/repos/local/profiles.repo";
import { createBasicPatientSettings } from "@/src/repos/utils";
import { runSync } from "@/src/syncEngine/syncService";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import OverrideWindowSettings from "./OverrideWindowSettings";

const basicSettings = createBasicPatientSettings("");

const PatientSettingsFields = ({ patient }: { patient: ProfileRow }) => {
  const settings = useAtomValue(PatientSettingsAtom);

  const baseFollowupSpacing =
    settings?.followupSpacingMinutes || basicSettings.followupSpacingMinutes;

  const baseNotificationSpacing =
    settings?.notificationSpacingMinutes ||
    basicSettings.notificationSpacingMinutes;

  const baseNotificationCount =
    settings?.notificationCount || basicSettings.notificationCount;

  const [followupSpacingMinutes, setFollowupSpacingMinutes] =
    useState(baseFollowupSpacing);

  const [notificationSpacingMinutes, setNotificationSpacingMinutes] = useState(
    baseNotificationSpacing,
  );

  const [notificationCount, setNotificationCount] = useState(
    baseNotificationCount,
  );

  const onSaveFollowupSpacing = async () => {
    if (!settings) return;
    await upsertPatientSettings({ ...settings, followupSpacingMinutes });
    Toast.show({
      type: "success",
      text1: "time between meals updated successfully",
    });
    await runSync();
  };

  const onSaveNotificationSpacing = async () => {
    if (!settings) return;
    await upsertPatientSettings({ ...settings, notificationSpacingMinutes });
    Toast.show({
      type: "success",
      text1: "time between notifications updated successfully",
    });
    await runSync();
  };

  const onSaveNotificationCount = async () => {
    if (!settings) return;
    await upsertPatientSettings({ ...settings, notificationCount });
    Toast.show({
      type: "success",
      text1: "notification count updated successfully",
    });
    await runSync();
  };

  return (
    <View style={{ gap: 10, paddingTop: 20 }}>
      <TextInput
        label="time between meals"
        placeholder="enter in minutes"
        mode="outlined"
        inputMode="numeric"
        value={followupSpacingMinutes.toString()}
        onChangeText={(text) => setFollowupSpacingMinutes(Number(text))}
      />
      {followupSpacingMinutes !== baseFollowupSpacing && (
        <Button uppercase mode="contained" onPress={onSaveFollowupSpacing}>
          SAVE
        </Button>
      )}
      <TextInput
        label="time between notifications"
        placeholder="enter in minutes"
        mode="outlined"
        inputMode="numeric"
        value={notificationSpacingMinutes.toString()}
        onChangeText={(text) => setNotificationSpacingMinutes(Number(text))}
      />
      {notificationSpacingMinutes !== baseNotificationSpacing && (
        <Button uppercase mode="contained" onPress={onSaveNotificationSpacing}>
          SAVE
        </Button>
      )}
      <TextInput
        label="how much notifications when time comes up?"
        placeholder="enter in minutes"
        mode="outlined"
        inputMode="numeric"
        value={notificationCount.toString()}
        onChangeText={(text) => setNotificationCount(Number(text))}
      />
      {notificationCount !== baseNotificationCount && (
        <Button uppercase mode="contained" onPress={onSaveNotificationCount}>
          SAVE
        </Button>
      )}
      <OverrideWindowSettings />
    </View>
  );
};

export default PatientSettingsFields;
