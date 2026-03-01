import supabase from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const handleEntry = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user.id) {
        await supabase.auth.signOut();
      }
      router.navigate("/(auth)/login");
    };

    handleEntry();
  }, [router]);

  return null;
}
