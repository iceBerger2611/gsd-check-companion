import { usePatientSettings } from "@/src/hooks/settings";
import { upsertPatientSettings } from "@/src/repos/local/patientSettings.repo";
import { runSync } from "@/src/syncEngine/syncService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";

export const toMinutes = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();

export const fromMinutes = (minutes: number, baseDate = new Date()) => {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
};

const getSaveErrorMessege = (
  startMinutes: number,
  endMinutes: number,
  followupSpacingMinutes: number,
  notificationCount: number,
): string | null => {
  let errors: string[] = [];
  if (endMinutes < 0 || endMinutes >= 1440) {
    errors.push("invalid end of window time");
  }
  if (startMinutes < 0 || startMinutes >= 1440) {
    errors.push("invalid start of window time");
  }
  if (notificationCount < 1) {
    errors.push("must add amount of notifications");
  }
  if (followupSpacingMinutes < 1) {
    errors.push("must add time between notifications");
  }
  const errorMessege = errors.join(", ");
  if (errorMessege) return errorMessege;
  return null;
};

const OverrideWindowSettings = () => {
  const { settings } = usePatientSettings();

  const baseWindowStartDate = fromMinutes(
    settings?.windowStartMinuteOfDay || 0,
  );

  const baseWindowEndDate = fromMinutes(settings?.windowEndMinuteOfDay || 180);

  const baseWindowFollowupSpacingMinutes =
    settings?.windowNotificationSpacingMinutes || 0;

  const baseWindowNotificationCount = settings?.windowNotificationCount || 0;

  const [windowStartDate, setWindowStartDate] = useState(baseWindowStartDate);

  const [windowEndDate, setWindowEndDate] = useState(baseWindowEndDate);

  const [windowFollowupSpacingMinutes, setWindowFollowupSpacingMinutes] =
    useState(baseWindowFollowupSpacingMinutes);

  const [windowNotificationCount, setWindowNotificationCount] = useState(
    baseWindowNotificationCount,
  );

  const handleWindowStartChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) return;

    setWindowStartDate(selectedDate);

    const minutes = selectedDate.getHours() * 60 + selectedDate.getMinutes();
    console.log("minutes from start of day:", minutes);
  };

  const handleWindowEndChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) return;

    setWindowEndDate(selectedDate);

    const minutes = selectedDate.getHours() * 60 + selectedDate.getMinutes();
    console.log("minutes from start of day:", minutes);
  };

  const onSave = async () => {
    const startMinutes = toMinutes(windowStartDate);
    const endMinutes = toMinutes(windowEndDate);
    const errorMessege = getSaveErrorMessege(
      startMinutes,
      endMinutes,
      windowFollowupSpacingMinutes,
      windowNotificationCount,
    );
    if (errorMessege) {
      Toast.show({
        type: "error",
        text1: errorMessege,
      });
      return;
    }

    if (!settings) return;
    await upsertPatientSettings({
      ...settings,
      windowStartMinuteOfDay: startMinutes,
      windowEndMinuteOfDay: endMinutes,
      windowNotificationCount,
      windowNotificationSpacingMinutes: windowFollowupSpacingMinutes,
    });
    Toast.show({
      type: "success",
      text1: "special behaviour updated successfully",
    });
    await runSync();
  };

  return (
    <>
      <Text variant="headlineSmall">Special behaviour</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Text>Start Time</Text>
        <DateTimePicker
          mode="time"
          value={windowStartDate}
          onChange={handleWindowStartChange}
        />
        <Text variant="headlineMedium">-</Text>
        <DateTimePicker
          mode="time"
          value={windowEndDate}
          onChange={handleWindowEndChange}
        />
        <Text>End Time</Text>
      </View>

      <TextInput
        label="time between meals"
        placeholder="enter in minutes"
        mode="outlined"
        inputMode="numeric"
        value={windowFollowupSpacingMinutes.toString()}
        onChangeText={(text) => setWindowFollowupSpacingMinutes(Number(text))}
      />
      <TextInput
        label="time between notifications"
        placeholder="enter in minutes"
        mode="outlined"
        inputMode="numeric"
        value={windowNotificationCount.toString()}
        onChangeText={(text) => setWindowNotificationCount(Number(text))}
      />
      <Button uppercase mode="contained" onPress={onSave}>
        SAVE
      </Button>
    </>
  );
};

export default OverrideWindowSettings;
