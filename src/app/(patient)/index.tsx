import Home from "@/src/components/Home";
import { FollowupType } from "@/src/db/schema";
import { UserProfileAtom } from "@/src/hooks/profile";
import { requestPermissionForNotifications } from "@/src/notifications/register";
import { useRouter } from "expo-router/build/hooks";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Menu, Text } from "react-native-paper";

const PatientPage = () => {
  const router = useRouter();
  const patient = useAtomValue(UserProfileAtom);
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

  return !patient ? (
    <View>
      <Text>Loading Data...</Text>
      <ActivityIndicator animating />
    </View>
  ) : (
    <View>
      <Menu
        visible={isLogMenuVisible}
        onDismiss={() => setIsLogMenuVisible(false)}
        anchor={
          <Button
            uppercase
            mode="contained"
            onPress={() => setIsLogMenuVisible((prev) => !prev)}
            style={{ marginHorizontal: 24, marginTop: 10 }}
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
      <Home patient={patient} userName={patient.displayName || "there"} />
    </View>
  );
};

export default PatientPage;
