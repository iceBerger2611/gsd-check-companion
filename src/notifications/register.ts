import * as Device from "expo-device";
import {
  getPermissionsAsync,
  IosAuthorizationStatus,
  PermissionStatus,
  requestPermissionsAsync,
} from "expo-notifications";
import Toast from "react-native-toast-message";

export const requestPermissionForNotifications = async () => {
  const { status: currStatus, ios } = await getPermissionsAsync();
  if (
    currStatus !== PermissionStatus.GRANTED ||
    (Device.osName === "iOS" &&
      ios?.status !== IosAuthorizationStatus.AUTHORIZED)
  ) {
    const { status } = await requestPermissionsAsync({
      ios: { allowAlert: true, allowCriticalAlerts: true, allowSound: true },
    });
    if (status !== PermissionStatus.GRANTED) {
      Toast.show({
        type: "error",
        text1: "you must allow notifications",
      });
    }
  }
};
