import { useSupervisorCurrentPatient } from "@/hooks/supervisorPatient";
import { Text } from "react-native-paper";

const DashboardTitle = () => {
  const { currentPatient } = useSupervisorCurrentPatient();

  return <Text>dashboard - {currentPatient?.displayName || "main"}</Text>;
};

export default DashboardTitle
