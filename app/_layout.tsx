import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { API_URL } from "@/config/apiConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { WebSocketProvider } from "@/hooks/useWebSocket";
import { TokenManager } from "@/utils/tokenManager";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

type Role = "staff" | "admin" | "superadmin";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  const [appReady, setAppReady] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const hasRun = useRef(false);

  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsMedium: require("../assets/fonts/Poppins-Medium.ttf"),
    PoppinsSemiBold: require("../assets/fonts/Poppins-SemiBold.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    PoppinsBlack: require("../assets/fonts/Poppins-Black.ttf"),
  });

  // ✅ Font loader
  useEffect(() => {
    if (fontsLoaded) {
      setAppReady(true);
    }
  }, [fontsLoaded]);

  // ✅ Push notification listeners
  useEffect(() => {
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Foreground notification:", notification);
      }
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("User interacted with notification:", response);
      }
    );

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);

  // ✅ Token validation & redirect
  useEffect(() => {
    if (!appReady) return;
    if (hasRun.current) return;
    hasRun.current = true;

    const validateAndRedirect = async () => {
      try {
        setIsCheckingToken(true);

        const token = await TokenManager.getStoredToken();

        if (!token) {
          console.log("No token found");
          await TokenManager.clearTokenData();
          return;
        }

        const response = await fetch(`${API_URL}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log("Token expired or invalid");
            await TokenManager.clearTokenData();
          }
          return;
        }

        const data = await response.json();
        const userData = data.user || data;
        const validRole: Role = userData.role;

        if (!validRole) {
          console.log("No role found in response");
          await TokenManager.clearTokenData();
          return;
        }

        await TokenManager.setTokenData(token, userData);

        console.log("Token valid, role =", validRole);

        const redirectPaths: Record<Role, string> = {
          staff: "/staff/home",
          admin: "/superadmin-admin/home",
          superadmin: "/superadmin-admin/home",
        };

        const expectedPath = redirectPaths[validRole];

        if (
          (validRole === "staff" && pathname.startsWith("/staff")) ||
          ((validRole === "admin" || validRole === "superadmin") &&
            pathname.startsWith("/superadmin-admin"))
        ) {
          console.log("Already in correct role page → skip redirect");
          return;
        }

        console.log("Redirecting to:", expectedPath);
        router.replace(expectedPath as never);
      } catch (error) {
        console.log("Token validation error:", error);
        await TokenManager.clearTokenData();
      } finally {
        setIsCheckingToken(false);
        SplashScreen.hideAsync();
      }
    };

    validateAndRedirect();
  }, [appReady, pathname, router]);

  if (!appReady || isCheckingToken) {
    return null;
  }

  return (
    <WebSocketProvider>
      <ThemeProvider
        value={{
          ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
          colors: {
            ...(colorScheme === "dark"
              ? DarkTheme.colors
              : DefaultTheme.colors),
          },
          fonts: {
            regular: { fontFamily: "Poppins", fontWeight: "400" },
            medium: { fontFamily: "PoppinsMedium", fontWeight: "500" },
            bold: { fontFamily: "PoppinsBold", fontWeight: "700" },
            heavy: { fontFamily: "PoppinsBlack", fontWeight: "900" },
          },
        }}
      >
        {/* Tambahkan loading state minimal untuk WebSocket */}
        {isCheckingToken ? null : ( // Tampilkan splash screen atau loading minimal
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
            <StatusBar style="auto" />
            {children}
          </>
        )}
      </ThemeProvider>
    </WebSocketProvider>
  );
}
