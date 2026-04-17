import { Register, updateProfileRole } from "@/src/db/authOperations";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { Button, RadioButton, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";

const RegisterPage = () => {
  const [email, setEmail] = useState<null | string>(null);
  const [password, setPassword] = useState<null | string>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [role, setRole] = useState<"patient" | "supervisor">("patient");
  const router = useRouter();

  const onSignUp = async () => {
    if (!email || !email.trim() || !password || !password?.trim()) {
      Toast.show({
        type: "error",
        text1: "invalid email and / or password",
      });
      return;
    }
    setIsSigningIn(true);
    const registerRes = await Register(email, password);
    if (registerRes instanceof Error) {
      Toast.show({
        type: "error",
        text1: registerRes.message,
      });
      setIsSigningIn(false);
      return;
    }
    if (!registerRes.user || !registerRes.profile) {
      Toast.show({
        type: "error",
        text1: "Unknown Error",
      });
      setIsSigningIn(false);
      return;
    }
    const updateRes = await updateProfileRole(registerRes.profile.id, role);
    setIsSigningIn(false);
    if (updateRes instanceof Error) {
      Toast.show({
        type: "error",
        text1: updateRes.message,
      });
      return;
    }
    Toast.show({
      type: "success",
      text1: `Hi ${registerRes.profile?.display_name || "friend"}, You Have Registered!`,
    });
    if (role === 'patient') {
      router.navigate(`/(patient)?id=${registerRes.profile.id}`)
    } else {
      router.navigate(`/(supervisor)/dashboard?id=${registerRes.profile.id}`)
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
          <Text variant="displayMedium">Sign Up and Create your Account!</Text>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text variant="bodyLarge">I Am a:</Text>
            <RadioButton.Group
              value={role}
              onValueChange={(newVal) =>
                setRole(newVal as "patient" | "supervisor")
              }
            >
              <View style={{ flexDirection: "row" }}>
                <RadioButton.Item value="patient" label="Patient" />
                <RadioButton.Item value="supervisor" label="Supervisor" />
              </View>
            </RadioButton.Group>
          </View>
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
            onPress={onSignUp}
          >
            sign up
          </Button>
          <Button
            uppercase
            loading={isSigningIn}
            mode="contained-tonal"
            style={{ width: "50%" }}
            onPress={() => router.navigate("/(auth)/login")}
          >
            I have an account
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RegisterPage;
