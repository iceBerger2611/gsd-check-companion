import { LogIn } from "@/src/db/authOperations";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";

const LoginPage = () => {
  const [email, setEmail] = useState<null | string>(null);
  const [password, setPassword] = useState<null | string>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  const onLogIn = async () => {
    if (!email || !email.trim() || !password || !password?.trim()) {
      Toast.show({
        type: "error",
        text1: "invalid email and / or password",
      });
      return;
    }
    setIsLoggingIn(true);
    const res = await LogIn(email, password);
    setIsLoggingIn(false);
    if (res instanceof Error) {
      Toast.show({
        type: "error",
        text1: res.message,
      });
      return;
    }
    const { profile, session, user } = res;
    if (!profile || !session || !user) {
      Toast.show({
        type: "error",
        text1: "Unknown Error",
      });
      return;
    }
    Toast.show({
      type: "success",
      text1: `Hi ${profile.display_name || "friend"}, You are Logged In!`,
    });
    if (profile.role === 'patient') {
      router.navigate(`/(patient)?id=${profile.id}`)
    } else {
      router.navigate(`/(supervisor)/dashboard?id=${profile.id}`)
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={{
          flex: 1,
          paddingTop: 200,
          paddingHorizontal: 24,
          gap: 60,
          justifyContent: "flex-start",
        }}
      >
        <View style={{ alignContent: "stretch" }}>
          <Text variant="displayMedium">Hey There!</Text>
          <Text variant="headlineSmall">We don&apos;t know you yet</Text>
        </View>
        <View style={{ gap: 20 }}>
          <TextInput
            label="Email"
            placeholder="example@somedomain.com"
            mode="outlined"
            value={email || ""}
            inputMode="email"
            onChangeText={(text) => setEmail(text)}
          />
          <TextInput
            label="Password"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon="eye"
                onPress={() => setShowPassword((showPassword) => !showPassword)}
              />
            }
            mode="outlined"
            value={password || ""}
            onChangeText={(text) => setPassword(text)}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Button
            uppercase
            mode="outlined"
            style={{ width: "50%" }}
            onPress={() => router.navigate("/(auth)/register")}
          >
            sign up
          </Button>
          <Button
            uppercase
            loading={isLoggingIn}
            mode="contained-tonal"
            style={{ width: "50%" }}
            onPress={onLogIn}
          >
            log in
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginPage;
