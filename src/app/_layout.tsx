import { store } from "@/store";
import { Stack } from "expo-router";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { ActivityIndicator, PaperProvider, Portal } from "react-native-paper";
import Toast from "react-native-toast-message";
import { initLocalDB } from "../db/init";
import { useProfileSync } from "../hooks/profile";
import { appTheme } from "../lib/theme";
import { useNotificationRouting } from "../notifications/listeners";
import { LoadingProgressAtom } from "../hooks/loadingProgress";

function AppShell() {
  useNotificationRouting();
  useProfileSync();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(patient)" />
      <Stack.Screen name="(supervisor)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)
  const loadingProgress = useAtomValue(LoadingProgressAtom)

  useEffect(() => {
  let mounted = true;

  const init = async () => {
    await initLocalDB();
    if (mounted) setDbReady(true);
  };

  init();

  return () => {
    mounted = false;
  };
}, []);

  return (
    <JotaiProvider store={store}>
      <PaperProvider theme={appTheme}>
        {dbReady && <AppShell />}
        <Toast position="bottom" />
        {loadingProgress && <Portal><ActivityIndicator /></Portal>}
      </PaperProvider>
    </JotaiProvider>
  );
}
