import { createCareLinkInvite } from "@/repos/remote/careLinkInvites.remote";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import Toast from "react-native-toast-message";

const CreateCodeModal = () => {
  const [code, setCode] = useState<{ code: string; expiry: string } | null>(
    null,
  );

  const onCreate = async () => {
    if (code) return;
    const res = await createCareLinkInvite(120);
    if (res instanceof Error) {
      Toast.show({
        type: "error",
        text1: `an error has occured: ${res.message}. Please try again`,
      });
      return;
    }
    setCode({ code: res.code, expiry: res.expiresAt });
  };

  const onCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code.code);
  };

  return (
    <View style={{ justifyContent: "flex-start", gap: 10 }}>
      <Button uppercase mode="contained" onPress={onCreate}>
        CREATE CODE
      </Button>
      {code && (
        <>
          <Text>This will only appear once! copy the code below</Text>
          <View style={{ flexDirection: "row", alignItems: 'center' }}>
            <Text>{code.code}</Text>
            <IconButton icon="content-copy" mode="outlined" onPress={onCopy} />
          </View>
          <Text>Expires at: {code.expiry}</Text>
        </>
      )}
    </View>
  );
};

export default CreateCodeModal;
