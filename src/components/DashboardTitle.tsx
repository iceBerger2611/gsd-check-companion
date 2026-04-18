import { CurrentPatientAtom } from "@/src/hooks/supervisorPatient";
import { useAtomValue } from "jotai";
import { Text } from "react-native-paper";

const DashboardTitle = () => {
  const currentPatient = useAtomValue(CurrentPatientAtom);

  return <Text>dashboard - {currentPatient?.displayName || "main"}</Text>;
};

export default DashboardTitle;
