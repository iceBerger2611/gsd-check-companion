import PatientSettingsFields from "@/components/PatientSettingsFields";
import ThresholdRuleInput from "@/components/ThresholdRuleInput";
import { useGetProfile } from "@/hooks/profile";
import { upsertProfile } from "@/repos/local/profiles.repo";
import {
  listThresholdRulesByPatient,
  ThresholdRuleRow,
} from "@/repos/local/thresholdRules.repo";
import { runSync } from "@/services/syncService";
import { useEffect, useState } from "react";
import {
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Divider,
  List,
  Text,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";

const PatientSettings = () => {
  const { isFetching, profile: patient } = useGetProfile();
  const [displayName, setDispalyName] = useState(patient?.displayName);
  const [thresholdRules, setThresholdRules] = useState<ThresholdRuleRow[]>([]);
  const [ThreshExpanded, setThreshExpanded] = useState(false);
  const [patientExpanded, setPatientExpanded] = useState(false);

  const onDisplaySave = async () => {
    if (!patient || !displayName) return;
    await upsertProfile({ ...patient, displayName });
    Toast.show({
      type: "success",
      text1: "name updated successfully",
    });
    await runSync();
  };

  useEffect(() => {
    if (patient?.displayName) {
      setDispalyName(patient.displayName);
    }
  }, [patient?.displayName]);

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
            {patient?.displayName !== displayName && (
              <Button uppercase mode="contained" onPress={onDisplaySave}>
                SAVE
              </Button>
            )}
            <List.Section>
              <List.Accordion
                title="Thresholds"
                expanded={ThreshExpanded}
                onPress={() => setThreshExpanded((prev) => !prev)}
              >
                <View style={{ gap: 10, paddingTop: 20 }}>
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
              </List.Accordion>
            </List.Section>
            <List.Section>
              <List.Accordion
                title="Patient Settings"
                expanded={patientExpanded}
                onPress={() => setPatientExpanded((prev) => !prev)}
              >
                {patient && <PatientSettingsFields patient={patient} />}
              </List.Accordion>
            </List.Section>
          </ScrollView>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default PatientSettings;
