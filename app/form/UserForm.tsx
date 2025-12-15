import Alert from "@/components/Alert"; // Import Alert
import Log from "@/components/Log";
import { API_URL } from "@/config/apiConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface UserFormData {
  name: string;
  username: string;
  password: string;
  role: string;
}

export default function UserFormPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const editData = useMemo(() => {
    return params?.editData ? JSON.parse(params.editData as string) : null;
  }, [params?.editData]);

  const isEdit = !!editData;

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    username: "",
    password: "",
    role: "staff",
  });

  const [uploadingForm, setUploadingForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [showResetAlert, setShowResetAlert] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await SecureStore.getItemAsync("role");
      setUserRole(role);
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        username: editData.username || "",
        password: "", // Kosongkan password saat edit (tidak bisa diubah)
        role: editData.role || "staff",
      });
    }
    setIsInitialized(false);
  }, [editData]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setLogMessage({
        type: "error",
        message: "Nama lengkap wajib diisi",
      });
      return false;
    }

    if (!formData.username.trim()) {
      setLogMessage({
        type: "error",
        message: "Username wajib diisi",
      });
      return false;
    }

    // Password hanya wajib untuk user baru (saat create)
    if (!isEdit && !formData.password.trim()) {
      setLogMessage({
        type: "error",
        message: "Password wajib diisi untuk user baru",
      });
      return false;
    }

    // Validasi panjang password untuk user baru
    if (!isEdit && formData.password.trim().length < 6) {
      setLogMessage({
        type: "error",
        message: "Password minimal 6 karakter",
      });
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!editData || userRole !== "superadmin") return;
    
    setResettingPassword(true);
    setLogMessage(null);

    try {
      const token = await SecureStore.getItemAsync("token");
      
      const response = await fetch(`${API_URL}/api/users/${editData.id}/reset-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Gagal reset password";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setLogMessage({
        type: "success",
        message: result.message || "Password berhasil direset ke 123456",
      });

      // Tutup alert setelah sukses
      setShowResetAlert(false);

    } catch (error: any) {
      setLogMessage({
        type: "error",
        message: error.message || "Terjadi kesalahan saat reset password",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCreateUser = async () => {
    const token = await SecureStore.getItemAsync("token");
    const userRole = await SecureStore.getItemAsync("role");

    // Pilih endpoint sesuai role
    let endpoint = "";
    if (formData.role === "admin") {
      endpoint = "admin";
    } else if (formData.role === "staff") {
      endpoint = "staff";
    } else if (formData.role === "superadmin") {
      endpoint = "superadmin";
    }

    // Pastikan hanya superadmin yang bisa membuat admin
    if (formData.role === "admin" && userRole !== "superadmin") {
      throw new Error("Hanya superadmin yang bisa membuat admin");
    }

    const response = await fetch(`${API_URL}/api/users/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Gagal menambahkan user";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  const handleUpdateUser = async () => {
    const token = await SecureStore.getItemAsync("token");

    // Untuk update, kirim data sebagai FormData sesuai dengan backend
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("username", formData.username);
    formDataToSend.append("role", formData.role);

    const response = await fetch(`${API_URL}/api/users/${editData.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formDataToSend,
    });

    if (!response.ok) {
      let errorMessage = "Gagal update user";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploadingForm(true);
    setLogMessage(null);

    try {
      if (isEdit) {
        await handleUpdateUser();
      } else {
        await handleCreateUser();
      }

      setLogMessage({
        type: "success",
        message: isEdit
          ? "User berhasil diperbarui"
          : "User berhasil ditambahkan",
      });

      setTimeout(() => {
        console.log("DocumentsForm: calling router.back()");
        try {
          router.back();
          console.log("DocumentsForm: router.back() called");
        } catch (err) {
          console.error("DocumentsForm: router.back() failed", err);
          setLogMessage({
            type: "error",
            message: "Gagal kembali ke halaman sebelumnya",
          });
        }
      }, 1200);
    } catch (error: any) {
      setLogMessage({
        type: "error",
        message: error.message || "Terjadi kesalahan",
      });
    } finally {
      setUploadingForm(false);
    }
  };

  const showResetConfirmation = () => {
    setShowResetAlert(true);
  };

  const cancelReset = () => {
    setShowResetAlert(false);
  };

  if (isInitialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0055A5" />
        <Text style={styles.loadingText}>Memuat formulir...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.floatingLogContainer}>
          {logMessage && (
            <Log
              type={logMessage.type}
              message={logMessage.message}
              onHide={() => setLogMessage(null)}
            />
          )}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? "Edit User" : "Tambah User Baru"}
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              {/* Nama Lengkap */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>

              {/* Username */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan username"
                  placeholderTextColor="#999"
                  value={formData.username}
                  onChangeText={(text) =>
                    setFormData({ ...formData, username: text })
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password - HANYA untuk user baru */}
              {!isEdit && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                  />
                  <Text style={styles.requiredHint}>
                    * Password wajib diisi untuk user baru (minimal 6 karakter)
                  </Text>
                </View>
              )}

              {/* Role */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Role</Text>
                <View style={styles.radioGroup}>
                  {["staff", "admin"].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={styles.radioOption}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          role: role as any,
                        })
                      }
                    >
                      <View style={styles.radioCircle}>
                        {formData.role === role && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text style={styles.radioText}>
                        {role === "staff" ? "User" : "Admin"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tombol Reset Password - Hanya untuk superadmin dan mode edit */}
              {isEdit && userRole === "superadmin" && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Reset Password</Text>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={showResetConfirmation}
                    disabled={resettingPassword}
                  >
                    {resettingPassword ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.resetButtonText}>
                        Reset Password ke Default
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.resetHint}>
                    * Password akan direset ke 123456
                  </Text>
                </View>
              )}

              {/* Info untuk edit mode */}
              {isEdit && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Password tidak dapat diubah melalui form ini. Untuk mengubah
                    password, gunakan fitur Ubah Password di halaman profil.
                  </Text>
                </View>
              )}

              {/* Tombol Aksi */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => router.back()}
                  disabled={uploadingForm}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    uploadingForm && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={uploadingForm}
                >
                  {uploadingForm ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isEdit ? "Update" : "Simpan"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Alert untuk konfirmasi reset password */}
        {showResetAlert && (
          <Alert
            title="Konfirmasi Reset Password"
            message={`Yakin reset password ${editData?.name} ke "123456"? User harus login ulang.`}
            onYes={handleResetPassword}
            onNo={cancelReset}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Styles - Tambahkan style untuk tombol reset
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#666",
  },
  floatingLogContainer: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "white",
  },
  backButton: {
    padding: 8,
    paddingTop: 35,
  },
  backButtonText: {
    fontSize: 24,
    color: "#0055A5",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PoppinsBold",
    color: "#333",
    textAlign: "center",
    paddingTop: 35,
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#333",
    marginBottom: 8,
  },
  requiredHint: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#dc3545",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: "Poppins",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  radioGroup: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0055A5",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0055A5",
  },
  radioText: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#333",
    textTransform: "capitalize",
  },
  // Reset Password Button Styles
  resetButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
  resetHint: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
    marginTop: 6,
    fontStyle: "italic",
  },
  infoBox: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
    marginBottom: 24,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#856404",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6c757d",
    minWidth: 80,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#6c757d",
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0055A5",
    minWidth: 100,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
});