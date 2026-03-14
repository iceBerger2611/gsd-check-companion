import RecentHistory from "@/components/RecentHistory";
import { FollowupType } from "@/db/schema";
import { useGetProfile } from "@/hooks/profile";
import { requestPermissionForNotifications } from "@/notifications/register";
import { useRouter } from "expo-router/build/hooks";
import {} from "expo-sqlite";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Menu, Text } from "react-native-paper";

const PatientPage = () => {
  const router = useRouter();
  const { isFetching, profile: patient } = useGetProfile();
  const [isLogMenuVisible, setIsLogMenuVisible] = useState(false);

  useEffect(() => {
    const handleNotificationsPermissions = async () => {
      await requestPermissionForNotifications();
    };

    handleNotificationsPermissions();
  }, []);

  const navigateToLog = (followup: FollowupType, patientId: string) => {
    setIsLogMenuVisible(false);
    router.navigate(
      `/(patient)/log?followup=${followup}&patientId=${patientId}`,
    );
  };

  return isFetching ? (
    <View>
      <Text>Loading Data...</Text>
      <ActivityIndicator animating />
    </View>
  ) : (
    <View
      style={{
        paddingTop: 20,
        paddingHorizontal: 24,
        gap: 30,
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
  );
};

export default PatientPage;
