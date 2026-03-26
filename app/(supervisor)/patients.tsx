import PatientsList from "@/components/PatientsList";
import SupervisorCode from "@/components/SupervisorCode";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

export default function Screen() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View
      style={{
        justifyContent: "flex-start",
        paddingTop: 20,
        paddingHorizontal: 24,
        gap: 30,
      }}
    >
      <PatientsList />
      <View style={{ flex: 1 }} />
      <SupervisorCode />
    </View>
    </TouchableWithoutFeedback>
  );
}
