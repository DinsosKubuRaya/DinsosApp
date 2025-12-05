import { TokenManager } from "@/utils/tokenManager";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabItem = {
  name: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

export default function BottomBar() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    TokenManager.getStoredRole().then(setRole);
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (isKeyboardVisible || !role) return null; // sembunyikan saat keyboard / role belum terambil

  let tabs: TabItem[] = [];

  if (role === "staff") {
    // === Bottom bar untuk STAFF ===
    tabs = [
      {
        name: "Beranda",
        path: "/staff/home",
        icon: "home-outline",
        activeIcon: "home",
      },
      {
        name: "surat",
        path: "/staff/personal",
        icon: "mail-outline",
        activeIcon: "mail",
      },
      {
        name: "Dokumen",
        path: "/staff/document",
        icon: "folder-open-outline",
        activeIcon: "folder-open",
      },
      {
        name: "Profile",
        path: "/staff/profile",
        icon: "person-circle-outline",
        activeIcon: "person-circle",
      },
    ];
  } else {
    // === Bottom bar untuk ADMIN & SUPERADMIN ===
    tabs = [
      {
        name: "Beranda",
        path: "/superadmin-admin/home",
        icon: "home-outline",
        activeIcon: "home",
      },
      {
        name: "Pengguna",
        path: "/superadmin-admin/users",
        icon: "people-outline",
        activeIcon: "people",
      },
      {
        name: "Dokumen",
        path: "/superadmin-admin/documents",
        icon: "folder-outline",
        activeIcon: "folder",
      },
      {
        name: "Pribadi",
        path: "/superadmin-admin/personal",
        icon: "person-outline",
        activeIcon: "person",
      },
    ];
  }

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.path);

        return (
          <TouchableOpacity
            key={tab.path}
            onPress={() => router.push(tab.path as any)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={23}
              color={active ? "#007aff" : "#555"}
            />

            <Text style={[styles.text, active && styles.activeText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 55,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -7,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: "#007aff",
  },
  text: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#555",
    marginTop: 3,
  },
  activeText: {
    color: "#007aff",
    fontFamily: "PoppinsSemiBold",
  },
});
