import { initLocalDB } from "@/db/init";
import { appTheme } from "@/lib/theme";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  useEffect(() => {
    initLocalDB();
  }, []);
  return (
    <PaperProvider theme={appTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(supervisor)" />
      </Stack>
      <Toast position="bottom" />
    </PaperProvider>
  );
}
