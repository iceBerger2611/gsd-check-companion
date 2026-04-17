import { claimCareLinkInvite } from "@/src/repos/remote/careLinkInvites.remote";
import { getErrorMessage } from "@/src/repos/utils";
import { runSync } from "@/src/syncEngine/syncService";
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";

const SupervisorCode = () => {
  const [code, setCode] = useState("");

  const onApply = async () => {
    if (!code) {
      Toast.show({
        type: "error",
        text1: "code invalid",
      });
      return;
    }

    const res = await claimCareLinkInvite(code);
    if (res instanceof Error) {
      Toast.show({
        type: "error",
        text1: getErrorMessage(res),
      });
      return;
    }

    await runSync();
    setCode("");
  };

  return (
    <View style={{ gap: 10 }}>
      <TextInput
        value={code}
        onChangeText={(text) => setCode(text)}
        label="Invite Code"
        placeholder="enter the code your patient gave you to add him here"
      />
      <Button uppercase onPress={onApply} mode="outlined">
        APPLY
      </Button>
    </View>
  );
};

export default SupervisorCode;
