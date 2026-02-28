import supabase from "@/lib/supabase";
import { Profile } from "@/types/tables.types";
import { useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function Index() {
  const [Login, setLogin] = useState<false | Profile>(false);
  const [isLogging, setIslogging] = useState(false);

  const logIn = async () => {
    setIslogging(true)
    const res = await supabase.auth.signInWithPassword({
      email: "aberger2611@gmail.com",
      password: "2611Amitbe",
    });
    if (!res.error) {
      const profileRes = await supabase
        .from("profiles")
        .select("*")
        .eq("id", res.data.user.id);
      setLogin(profileRes.data?.[0] || false);
    }
    setIslogging(false)
  };

  const logOut = async () => {
    const res = await supabase.auth.signOut();
    if (!res.error) {
      setLogin(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {Login && (
        <>
          <Text>role: {Login.role}</Text>
          <Text>name: {Login.display_name}</Text>
        </>
      )}
      <Button dark={true} mode="contained" onPress={logIn} uppercase loading={isLogging}>
        login as amit
      </Button>
      <Button
        dark={true}
        mode="contained"
        onPress={logOut}
        disabled={!Login}
        uppercase
      >
        logout
      </Button>
    </View>
  );
}
