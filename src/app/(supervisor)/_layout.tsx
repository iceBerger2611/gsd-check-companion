import DashboardTitle from "@/src/components/DashboardTitle";
import supabase from "@/src/db/supabase";
import { runSync } from "@/src/syncEngine/syncService";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useState } from "react";
import { Appbar, Menu } from "react-native-paper";

const SupervisorHeader = () => {
  const [isMainMenuVisible, setIsMainMenuVisible] = useState(false);
  const router = useRouter();

  const onLogout = async () => {
    await supabase.auth.signOut();
    setIsMainMenuVisible(false);
    router.push("/(auth)/login");
  };

  const onSync = async () => {
    await runSync();
  };

  return (
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
      <Menu.Item onPress={onSync} title="Sync" />
    </Menu>
  );
};

export default function Layout() {
  return (
    <Drawer
      initialRouteName="dashboard"
      screenOptions={{
        headerRight: () => <SupervisorHeader />,
        //headerStyle: { transform: 'scaleY(1.2)' }
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{ drawerLabel: "Dashboard", headerTitle: DashboardTitle }}
      />
      <Drawer.Screen name="patients" options={{ drawerLabel: "Patients" }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: "Settings" }} />
    </Drawer>
  );
}
