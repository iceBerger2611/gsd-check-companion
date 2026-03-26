import { initLocalDB } from "@/db/init";
import { appTheme } from "@/lib/theme";
import { useNotificationRouting } from "@/notifications/listeners";
import { store } from "@/store";
import { Stack } from "expo-router";
import { Provider as JotaiProvider } from "jotai";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  useEffect(() => {
    initLocalDB();
  }, []);

  useNotificationRouting();

  return (
    <JotaiProvider store={store}>
      <PaperProvider theme={appTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(patient)" />
          <Stack.Screen name="(supervisor)" />
        </Stack>
        <Toast position="bottom" />
      </PaperProvider>
    </JotaiProvider>
  );
}
