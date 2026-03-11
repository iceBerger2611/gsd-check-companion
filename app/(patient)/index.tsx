import RecentHistory from "@/components/RecentHistory";
import { GetUserProfile } from "@/db/operations";
import { FollowupType } from "@/db/schema";
import supabase from "@/lib/supabase";
import { appTheme } from "@/lib/theme";
import { Profile } from "@/types/tables.types";
import { useRouter, useSearchParams } from "expo-router/build/hooks";
import {} from "expo-sqlite";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Appbar, Button, Menu, Text } from "react-native-paper";

const PatientPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Profile | null>(null);
  const [isMainMenuVisible, setIsMainMenuVisible] = useState(false);
  const [isLogMenuVisible, setIsLogMenuVisible] = useState(false);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.navigate("/(auth)/login");
  };

  const navigateToLog = (followup: FollowupType, patientId: string) => {
    setIsLogMenuVisible(false);
    router.navigate(
      `/(patient)/log?followup=${followup}&patientId=${patientId}`,
    );
  };

  useEffect(() => {
    const fetchPatient = async (id: string) => {
      const res = await GetUserProfile(id);
      if (!(res instanceof Error)) {
        setPatient(res);
      }
    };

    const id = searchParams.get("id");
    if (id && !patient) {
      fetchPatient(id);
    }
  }, [patient, searchParams]);

  return (
    <>
      <Appbar.Header
        mode="small"
        elevated
        style={{ direction: "rtl", backgroundColor: appTheme.colors.surface }}
      >
        <Menu
          visible={isMainMenuVisible}
          onDismiss={() => setIsMainMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setIsMainMenuVisible((prev) => !prev)}
            />
          }
        >
          <Menu.Item onPress={onLogout} title="Logout" />
        </Menu>
      </Appbar.Header>
      <View
        style={{
          flex: 1,
          paddingTop: 20,
          paddingHorizontal: 24,
          gap: 100,
          justifyContent: "flex-start",
        }}
      >
        {patient?.id && (
          <Menu
            visible={isLogMenuVisible}
            onDismiss={() => setIsLogMenuVisible(false)}
            anchor={
              <Button
                uppercase
                mode="contained"
                onPress={() => setIsLogMenuVisible((prev) => !prev)}
              >
                NEW LOG
              </Button>
            }
          >
            <Menu.Item
              onPress={() => navigateToLog("recheck", patient.id)}
              title="Check"
            />
            <Menu.Item
              onPress={() => navigateToLog("drink_cornstarch", patient.id)}
              title="Drink Cornstarch"
            />
          </Menu>
        )}
        <View style={{ gap: 10, justifyContent: "center" }}>
          <View style={{ alignItems: "center" }}>
            <Text variant="displaySmall">
              Hello, {patient?.display_name || "there"}!
            </Text>
          </View>
          {patient?.id && <RecentHistory patientId={patient.id} />}
        </View>
      </View>
    </>
  );
};

export default PatientPage;
