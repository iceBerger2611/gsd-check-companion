import ThresholdRuleInput from "@/components/ThresholdRuleInput";
import { useGetProfile } from "@/hooks/profile";
import {
  listThresholdRulesByPatient,
  ThresholdRuleRow,
} from "@/repos/thresholdRules";
import { useEffect, useState } from "react";
import {
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Divider,
  Text,
  TextInput,
} from "react-native-paper";

const PatientSettings = () => {
  const { isFetching, profile: patient } = useGetProfile();
  const [displayName, setDispalyName] = useState(patient?.display_name);
  const [thresholdRules, setThresholdRules] = useState<ThresholdRuleRow[]>([]);

  useEffect(() => {
    if (patient?.display_name) {
      setDispalyName(patient.display_name);
    }
  }, [patient?.display_name]);

  useEffect(() => {
    const fetchThresh = async (patientId: string) => {
      const results = await listThresholdRulesByPatient(patientId);
      setThresholdRules(results);
    };
    if (patient?.id) {
      fetchThresh(patient.id);
    }
  }, [patient?.id]);
  return (
    <View
      style={{
        paddingTop: 20,
        paddingHorizontal: 24,
        gap: 100,
        justifyContent: "flex-start",
      }}
    >
      {isFetching ? (
        <View>
          <Text>Loading Data...</Text>
          <ActivityIndicator animating />
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={{ gap: 15, marginBottom: 200 }}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              label="display name"
              placeholder="enter your display name"
              mode="outlined"
              value={displayName || undefined}
              onChangeText={(text) => setDispalyName(text)}
            />
            <View style={{ gap: 10, paddingTop: 20 }}>
              <View style={{ alignItems: "center" }}>
                <Text variant="headlineSmall">Thresholds</Text>
              </View>
              {thresholdRules.map((thresholdRule) => (
                <View key={thresholdRule.id}>
                  <Divider bold />
                  <ThresholdRuleInput
                    key={thresholdRule.id}
                    threshold={thresholdRule}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default PatientSettings;
