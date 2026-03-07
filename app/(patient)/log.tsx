import ReadingForm from "@/components/ReadingForm";
import { FollowupType } from "@/db/schema";
import { useSearchParams } from "expo-router/build/hooks";

export default function Screen() {
  const searchParams = useSearchParams();

  const followup = searchParams.get("followup");
  const patientId = searchParams.get("patientId");
  return (
    <ReadingForm
      followup={(followup as FollowupType) ?? "recheck"}
      patientId={patientId ?? ""}
    />
  );
}
