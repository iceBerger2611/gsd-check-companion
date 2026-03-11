import { GetUserProfile } from "@/db/operations";
import supabase from "@/lib/supabase";
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
          if (res.role === "supervisor") {
            router.navigate(`/(supervisor)/dashboard?id=${id}`);
          } else {
            router.navigate(`/(patient)?id=${id}`);
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
