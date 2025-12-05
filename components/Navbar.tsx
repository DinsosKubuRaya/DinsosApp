import { API_URL } from "@/config/apiConfig";
import { useWebSocketData } from "@/hooks/useWebSocket";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";

import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Log from "./Log"; // Import komponen Log dari folder yang sama

/*
|--------------------------------------------------------------------------
| Helper: get initials
|--------------------------------------------------------------------------
*/
const getInitials = (fullName: string) => {
  if (!fullName) return "U";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/*
|--------------------------------------------------------------------------
| Helper: random but consistent color from name
|--------------------------------------------------------------------------
*/
const getRandomColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 55%)`;
};

/*
|--------------------------------------------------------------------------
| Avatar Component
|--------------------------------------------------------------------------
*/
type AvatarProps = {
  name: string;
  photoUrl?: string | null;
};

const Avatar = ({ name, photoUrl }: AvatarProps) => {
  const [error, setError] = useState(false);

  if (photoUrl && !error) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={styles.profilePic}
        onError={() => setError(true)} // Jika foto error → fallback ke inisial
      />
    );
  }

  return (
    <View
      style={[
        styles.profilePic,
        {
          backgroundColor: getRandomColor(name),
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Text style={styles.initialText}>{getInitials(name)}</Text>
    </View>
  );
};

export default function Navbar() {
  const router = useRouter();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // Tambah state untuk role

  // Use global WebSocket context
  const { unreadCount, setUnreadCount, profileData, updateProfileData } =
    useWebSocketData();

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      fetchUnreadCount(); // Ambil jumlah notifikasi yang belum dibaca
    }, [])
  );

  const loadUserData = async () => {
    const storedName = await SecureStore.getItemAsync("name");
    const storedPhoto = await SecureStore.getItemAsync("photo_url");
    const storedRole = await SecureStore.getItemAsync("role"); // Ambil role dari storage

    if (storedName || storedPhoto) {
      updateProfileData(storedName || "", storedPhoto || "");
    }

    if (storedRole) {
      setUserRole(storedRole); // Set role ke state
    }
  };

  // Fungsi untuk mengambil jumlah notifikasi yang belum dibaca
  const fetchUnreadCount = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setLogMessage({
        type: "error",
        message: "Gagal memuat jumlah notifikasi",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const tokenId = await SecureStore.getItemAsync("token_id");
      const token = await SecureStore.getItemAsync("token");

      if (!tokenId || !token) {
        setLogMessage({
          type: "error",
          message: "Token tidak ditemukan",
        });
        return;
      }

      const res = await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token_id: tokenId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLogMessage({
          type: "error",
          message: data.error || "Gagal logout",
        });
        return;
      }

      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("token_id");
      await SecureStore.deleteItemAsync("name");
      await SecureStore.deleteItemAsync("role");
      await SecureStore.deleteItemAsync("username");
      await SecureStore.deleteItemAsync("photo_url");

      // Reset WebSocket state
      setUnreadCount(0);
      updateProfileData("", "");

      setLogMessage({
        type: "success",
        message: "Logout berhasil",
      });

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);
      setLogMessage({
        type: "error",
        message: "Terjadi kesalahan saat logout",
      });
    }
  };

  const handleProfile = () => {
    setDropdownVisible(false);
    router.push("/profile");
  };

  const handleNotification = () => {
    router.push("/notifikasi");
  };

  const handleLogs = () => {
    setDropdownVisible(false);
    router.push("/logs");
  };

  return (
    <View style={styles.navbar}>
      {/* Floating Log Container */}
      <View style={styles.floatingLogContainer}>
        {logMessage && (
          <Log
            type={logMessage.type}
            message={logMessage.message}
            onHide={() => setLogMessage(null)}
          />
        )}
      </View>

      <Image
        source={require("@/assets/images/logo_dinsos-remove.png")}
        style={styles.logo}
      />

      <View style={styles.rightBox}>
        {/* Tombol Notifikasi dengan ikon lonceng dan badge */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotification}
        >
          <Text style={styles.notificationIcon}>🔔</Text>

          {/* Badge notifikasi */}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tampilkan avatar hanya jika role bukan staff */}
        {userRole !== "staff" ? (
          // Admin & Superadmin → foto dapat ditekan untuk membuka dropdown
          <TouchableOpacity onPress={() => setDropdownVisible(true)}>
            <Avatar name={profileData.name} photoUrl={profileData.photoUrl} />
          </TouchableOpacity>
        ) : (
          // Staff → hanya menampilkan foto, tidak bisa ditekan
          <View>
            <Avatar name={profileData.name} photoUrl={profileData.photoUrl} />
          </View>
        )}
      </View>

      {/* Modal dropdown hanya ditampilkan jika role bukan staff */}
      {userRole !== "staff" && (
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdown}>
              <TouchableOpacity onPress={handleProfile} style={styles.item}>
                <Text style={styles.itemText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogs} style={styles.item}>
                <Text style={styles.itemText}>Aktivitas</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogout} style={styles.item}>
                <Text style={styles.itemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    width: "100%",
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    position: "relative", // Penting untuk positioning log
  },
  floatingLogContainer: {
    position: "absolute",
    top: 80, // Sesuaikan dengan kebutuhan
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginLeft: -14,
  },
  rightBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 50,
    overflow: "hidden",
  },
  initialText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dropdown: {
    backgroundColor: "#fff",
    width: 150,
    borderRadius: 8,
    paddingVertical: 6,
    elevation: 5,
    marginRight: 6,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    fontSize: 13,
    fontFamily: "Poppins",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    position: "relative", // Penting untuk positioning badge
  },
  notificationIcon: {
    fontSize: 20,
  },
  // Styles untuk badge notifikasi
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "PoppinsBold",
    textAlign: "center",
  },
});
