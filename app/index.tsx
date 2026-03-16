import { GetUserProfile } from "@/db/operations";
import supabase from "@/lib/supabase";
import { runSync } from "@/services/syncService";
import { ErrorBoundaryProps, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "red" }}>
      <Text>{error.message}</Text>
      <Text onPress={retry}>Try Again?</Text>
    </View>
  );
}

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const handleEntry = async () => {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (id) {
        const res = await GetUserProfile(id);
        if (res && !(res instanceof Error)) {
          await runSync();
          const refreshed = await GetUserProfile(id);
          if (refreshed instanceof Error) {
            await supabase.auth.signOut();
          } else {
            if (res.role === "supervisor") {
              router.navigate(`/(supervisor)/dashboard`);
            } else {
              router.navigate(`/(patient)`);
            }
          }
        } else {
          await supabase.auth.signOut();
        }
      } else {
        router.navigate("/(auth)/login");
      }
    };

    handleEntry();
  }, [router]);

  return null;
}
