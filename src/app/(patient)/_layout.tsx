import CreateCodeModal from "@/src/components/CreateCodeModal";
import supabase from "@/src/db/supabase";
import { appTheme } from "@/src/lib/theme";
import { runSync } from "@/src/syncEngine/syncService";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Appbar, Menu, Modal, Portal } from "react-native-paper";

const PatientHeader = ({
  navigation,
  options,
  route,
}: NativeStackHeaderProps) => {
  const [isMainMenuVisible, setIsMainMenuVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const router = useRouter();

  const onLogout = async () => {
    await supabase.auth.signOut();
    setIsMainMenuVisible(false);
    router.push("/(auth)/login");
  };

  const onSettings = () => {
    setIsMainMenuVisible(false);
    router.push("/(patient)/settings");
  };

  const onCode = () => {
    setIsModalVisible(true);
    setIsMainMenuVisible(false);
  };

  const onSync = async () => {
    await runSync();
  };

  return (
    <Appbar.Header
      mode="small"
      elevated
      style={{ backgroundColor: appTheme.colors.surface }}
    >
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: "white",
            padding: 20,
            height: "60%",
            marginHorizontal: 50,
          }}
        >
          <CreateCodeModal />
        </Modal>
      </Portal>
      {router.canDismiss() && !route.name.includes("index") && (
        <Appbar.BackAction onPress={() => router.dismiss()} />
      )}
      <Appbar.Content title="" />
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
        <Menu.Item onPress={onSettings} title="Settings" />
        <Menu.Item onPress={onSync} title="Sync" />
        <Menu.Item onPress={onCode} title="Create Invite Code" />
      </Menu>
    </Appbar.Header>
  );
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ header: (props) => <PatientHeader {...props} /> }}>
      <Stack.Screen name="log" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerBackVisible: true }} />
    </Stack>
  );
}
