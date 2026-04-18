import ReadingForm from "@/src/components/ReadingForm";
import { UserProfileAtom } from "@/src/hooks/profile";
import { NotificationData } from "@/src/notifications/scheduler";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { useAtomValue } from "jotai";

export default function Screen() {
  const { followup, followupId } =
    useLocalSearchParams<Partial<NotificationData>>();
  const patient = useAtomValue(UserProfileAtom);

  return (
    <ReadingForm
      followup={followup ?? "recheck"}
      patientId={patient?.id ?? ""}
      sourceFollowupId={followupId}
    />
  );
}
