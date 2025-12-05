import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerPushToken() {
  if (!Device.isDevice) {
    console.log("❌ Push notif hanya bisa di device asli");
    return null;
  }

  console.log(`📱 App ownership: ${Constants.appOwnership}`);

  // Cek permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("❌ User menolak izin notif");
    return null;
  }

  // Setup Android notification channels
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("high-priority", {
      name: "High Priority",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      sound: "default",
    });
  }

  const isExpoGo = Constants.appOwnership === "expo";

  try {
    if (isExpoGo) {
      console.log("📱 Running in Expo Go - Using Expo token");
      const expoTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "38a8a718-ab3c-4116-a4c8-7dae6be95900",
      });
      console.log("📌 Expo Push Token:", expoTokenData.data);
      return expoTokenData.data;
    } else {
      console.log("📱 Running in Dev Build");

      if (Platform.OS === "android") {
        try {
          const deviceTokenData = await Notifications.getDevicePushTokenAsync();
          console.log("📌 Device (FCM) Token:", deviceTokenData.data);
          return deviceTokenData.data;
        } catch (deviceError) {
          console.log("⚠️ Failed to get device token, falling back to Expo:", deviceError);
        }
      }

      // Fallback ke Expo token (iOS atau jika device token gagal)
      console.log("🔄 Falling back to Expo token");
      const expoTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "38a8a718-ab3c-4116-a4c8-7dae6be95900",
      });
      console.log("📌 Fallback Expo Token:", expoTokenData.data);
      return expoTokenData.data;
    }
  } catch (error) {
    console.error("❌ Error getting push token:", error);
    return null;
  }
}
