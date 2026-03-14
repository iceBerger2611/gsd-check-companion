import supabase from "@/lib/supabase";
import { appTheme } from "@/lib/theme";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Appbar, Menu } from "react-native-paper";

const PatientHeader = ({
  navigation,
  options,
  route,
}: NativeStackHeaderProps) => {
  const [isMainMenuVisible, setIsMainMenuVisible] = useState(false);
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

  return (
    <Appbar.Header
      mode="small"
      elevated
      style={{ backgroundColor: appTheme.colors.surface }}
    >
      {router.canDismiss() && !route.name.includes('index') && (
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
