import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, View } from "react-native";
import { Button, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import { createPhotoPath, StepFuncProps } from "./utils";

const CornPhotoStep = ({
  followup,
  currStep,
  reading,
  setReading,
  setPhotoUri,
}: StepFuncProps) => {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const onTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Toast.show({
        type: "error",
        text1: "Permission to access the Camera is required",
      });
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (res.canceled) {
      return;
    }

    const photo = res.assets[0];
    setImage(photo);
    setPhotoUri({ cornstarch: photo.uri });
    const photoPath = createPhotoPath(reading, followup)
    setReading({
      ...reading,
      cornstarchPhotoUrl: photoPath,
    })
  };

  return (
    <View
      style={{
        gap: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text variant="headlineSmall">
        Take a Photo of Your Cornstarch
      </Text>
      <View
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Button icon="camera" mode="contained" uppercase onPress={onTakePhoto}>
          TAKE PHOTO
        </Button>
        {<Text>{image?.uri.split('/').at(-1) || "no photo taken"}</Text>}
        {image && (
          <Image
            source={{ uri: image.uri }}
            style={{ width: 250, height: 250, borderRadius: 12 }}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );
};

export default CornPhotoStep;
