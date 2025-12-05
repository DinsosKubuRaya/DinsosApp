import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerPushToken() {
  if (!Device.isDevice) {
    console.log("❌ Push notif hanya bisa di device asli");
    return null;
  }

  // Cek permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("❌ User menolak izin notif");
    return null;
  }

  // Ambil token EXPO dengan projectId
  const expoTokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "38a8a718-ab3c-4116-a4c8-7dae6be95900",
  });

  console.log("📌 Raw token object:", expoTokenData);

  const token = expoTokenData.data;

  console.log("📌 Final push token:", token);

  // Validasi format
  if (!token.startsWith("ExponentPushToken")) {
    console.log("⚠ WARNING: Token ini BUKAN Expo token yg valid!");
  }

  // Android Notification Channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
