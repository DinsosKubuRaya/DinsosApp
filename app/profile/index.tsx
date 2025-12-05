import Log from "@/components/Log";
import { API_URL } from "@/config/apiConfig";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type PickedImage = {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
  type?: string;
};

/*
|--------------------------------------------------------------------------
| Avatar Helpers
|--------------------------------------------------------------------------
*/
const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0];
  return parts[0][0] + parts[parts.length - 1][0];
};

const getRandomColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
  ];
  return colors[hash % colors.length];
};

export default function Profile() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [newPhoto, setNewPhoto] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);

  // State untuk Log
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const storedId = await SecureStore.getItemAsync("user_id");
    const storedName = await SecureStore.getItemAsync("name");
    const storedUsername = await SecureStore.getItemAsync("username");
    const storedPhoto = await SecureStore.getItemAsync("photo_url");

    if (storedId) setId(storedId);
    if (storedName) setName(storedName);
    if (storedUsername) setUsername(storedUsername);
    if (storedPhoto) setPhotoUrl(storedPhoto);
  };

  const handleLogHide = () => {
    setLogMessage(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const img = result.assets[0];
      setNewPhoto({
        uri: img.uri,
        width: img.width,
        height: img.height,
        type: img.mimeType || "image/jpeg",
      });
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !username.trim()) {
      setLogMessage({
        type: "error",
        message: "Nama dan username wajib diisi",
      });
      return;
    }

    if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
      setLogMessage({
        type: "error",
        message: "Harap isi kedua kolom password",
      });
      return;
    }

    setLoading(true);
    setLogMessage(null);

    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        setLoading(false);
        setLogMessage({
          type: "error",
          message: "Token tidak ditemukan",
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);

      if (oldPassword && newPassword) {
        formData.append("old_password", oldPassword);
        formData.append("new_password", newPassword);
      }

      if (newPhoto) {
        const file = {
          uri: newPhoto.uri,
          name: `photo.${newPhoto.uri.split(".").pop()}`,
          type: newPhoto.type || "image/jpeg",
        };
        formData.append("photo", file as any);
      }

      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        setLoading(false);
        setLogMessage({
          type: "error",
          message: "Format response tidak valid dari server",
        });
        return;
      }

      if (!response.ok) {
        setLoading(false);
        setLogMessage({
          type: "error",
          message: data.error || "Gagal update profile",
        });
        return;
      }

      await SecureStore.setItemAsync("name", data.user.name);
      await SecureStore.setItemAsync("username", data.user.username);

      if (data.user.photo_url) {
        await SecureStore.setItemAsync("photo_url", data.user.photo_url);
        setPhotoUrl(data.user.photo_url);
      }

      setNewPhoto(null);
      setOldPassword("");
      setNewPassword("");

      setLogMessage({
        type: "success",
        message: "Profile berhasil diperbarui!",
      });
    } catch (e) {
      console.log("Network Error:", e);
      setLogMessage({
        type: "error",
        message: "Terjadi kesalahan jaringan",
      });
    }

    setLoading(false);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "white" }}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.container}>
          {/* Header dengan Tombol Kembali */}
          <View style={styles.pageHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.pageTitle}>Profile</Text>
              <Text style={styles.pageSubtitle}>
                Kelola informasi profil Anda
              </Text>
            </View>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Floating Log Container */}
          <View style={styles.floatingLogContainer}>
            {logMessage && (
              <Log
                type={logMessage.type}
                message={logMessage.message}
                onHide={handleLogHide}
              />
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.avatarContainer}
              >
                {newPhoto || photoUrl ? (
                  <Image
                    source={{ uri: newPhoto?.uri || photoUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: getRandomColor(name) },
                    ]}
                  >
                    <Text style={styles.initial}>{getInitials(name)}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="at-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan username"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Ubah Password</Text>
              <Text style={styles.sectionSubtitle}>
                Kosongkan jika tidak ingin mengubah password
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password Lama</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan password lama"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password Baru</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan password baru"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
                onPress={!loading ? handleUpdate : undefined}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 22,
    color: "#1E293B",
  },
  pageSubtitle: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  floatingLogContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 130 : 110,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 15,
    paddingHorizontal: 23,
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#E2E8F0",
  },
  initial: {
    fontSize: 42,
    color: "#fff",
    textAlign: "center",
    lineHeight: 112,
    fontFamily: "PoppinsBold",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3B82F6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontFamily: "PoppinsBold",
    fontSize: 22,
    color: "#1E293B",
    marginBottom: 4,
  },
  userUsername: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#64748B",
  },
  formSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    color: "#1E293B",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "PoppinsMedium",
    fontSize: 14,
    marginBottom: 8,
    color: "#475569",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PoppinsBold",
  },
});
