import {
  useSupervisorCurrentPatient,
  useSupervisorPatients,
} from "@/hooks/supervisorPatient";
import { View, ViewStyle } from "react-native";
import { List, Text } from "react-native-paper";
import Toast from "react-native-toast-message";

const selectedStyle: ViewStyle = {
  borderWidth: 2,
  borderColor: "blue",
  borderStyle: "solid",
  borderRadius: 8,
};

const PatientsList = () => {
  const { currentPatient, changeCurrentPatient } =
    useSupervisorCurrentPatient();
  const { patients } = useSupervisorPatients();

  return (
    <List.Section style={{ gap: 10 }}>
      <View style={{ alignItems: "center" }}>
        <Text>{"( press on a patient to make it current )"}</Text>
      </View>
      {patients.map((patient) => {
        const isCurrentPatient = currentPatient?.id === patient.id;
        const title = `${patient.displayName || ""}${isCurrentPatient ? " - current" : ""}`;
        const style = isCurrentPatient && selectedStyle;

        const onPress = () => {
          if (isCurrentPatient) return;
          const res = changeCurrentPatient(patient.id);
          if (!res) {
            Toast.show({
              type: "error",
              text1: "something went wrong",
            });
          }
        };

        return (
          <List.Item
            key={patient.id}
            title={title}
            style={style}
            onPress={onPress}
          />
        );
      })}
    </List.Section>
  );
};

export default PatientsList;
