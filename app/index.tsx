import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Log from "@/components/Log";
import { API_URL } from "@/config/apiConfig";
import { registerPushToken } from "@/utils/registerPushToken";
import { TokenManager } from "@/utils/tokenManager";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleLogin = async () => {
    // Validasi input kosong
    if (!username.trim() || !password.trim()) {
      setLogMessage({
        type: "error",
        message: "Username dan password harus diisi",
      });
      return; // ❗ Keluar di sini, JANGAN ambil push token
    }

    setIsLoading(true);
    setLogMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device": "mobile",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }

      // Simpan token + user ke storage
      await TokenManager.setTokenData(
        data.token,
        data.user,
        String(data.token_id)
      );

      // Ambil push token
      setLogMessage({
        type: "success",
        message: "Login berhasil! Mengambil push token...",
      });

      const pushToken = await registerPushToken();

      // Kirim push token ke backend
      if (pushToken) {
        await fetch(`${API_URL}/api/users/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            token: pushToken,
            user_id: data.user.id,
          }),
        });
      }

      // Redirect berdasarkan role
      setLogMessage({
        type: "success",
        message: "Login berhasil! Mengalihkan...",
      });

      const redirectPaths: Record<string, string> = {
        staff: "/staff/home",
        admin: "/superadmin-admin/home",
        superadmin: "/superadmin-admin/home",
      };

      const role = data.user.role;
      const redirectPath = redirectPaths[role];

      if (redirectPath) {
        router.replace(redirectPath as any);
      } else {
        setLogMessage({
          type: "error",
          message: "Role tidak dikenali",
        });
        await TokenManager.clearTokenData();
      }
    } catch (error: any) {
      console.log("Login error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Terjadi kesalahan server",
      });
      await TokenManager.clearTokenData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert("Info", "Fitur lupa password sedang dibuat");
  };

  const handleLogHide = () => {
    setLogMessage(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Floating Log Container - Diluar ScrollView agar tetap di atas */}
      <View style={styles.floatingLogContainer}>
        {logMessage && (
          <Log
            type={logMessage.type}
            message={logMessage.message}
            onHide={handleLogHide}
          />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <Image
                source={require("@/assets/images/logo_dinsos-remove.png")}
                style={styles.logo}
              />

              <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan username Anda"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Password</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan password Anda"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    textContentType="oneTimeCode"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: 10,
                      padding: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#555" }}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Loading..." : "Login"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  floatingLogContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 10,
    marginTop: -100,
    resizeMode: "contain",
  },
  formGroup: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-start",
    marginBottom: 1,
    marginLeft: 8,
  },
  forgotPasswordText: {
    color: "#0055A5",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
  button: {
    width: "100%",
    backgroundColor: "#125696ff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PoppinsBold",
  },
});
