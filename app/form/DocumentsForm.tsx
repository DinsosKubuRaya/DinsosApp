import Log from "@/components/Log";
import { API_URL } from "@/config/apiConfig";
import * as DocumentPicker from "expo-document-picker";
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

interface DocumentFormData {
  sender?: string;
  subject: string;
  letter_type?: "masuk" | "keluar";
  file?: any;
}

export default function DocumentsForm() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isStaffDocument = params?.isStaffDocument === "true";

  const editData = useMemo(() => {
    if (!params?.editData) return null;
    try {
      return JSON.parse(params.editData as string);
    } catch {
      return null;
    }
  }, [params.editData]);

  const isEdit = !!editData;

  const [formData, setFormData] = useState<DocumentFormData>({
    sender: "",
    subject: "",
    letter_type: "masuk",
  });

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadingForm, setUploadingForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);

  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!editData) return;

    setFormData({
      sender: editData.sender || "",
      subject: editData.subject || "",
      letter_type: editData.letter_type || "masuk",
    });

    setSelectedFile(null);
    setIsInitialized(true);
  }, [editData]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      setSelectedFile(result.assets[0]);
    } catch {
      setLogMessage({
        type: "error",
        message: "Gagal memilih file",
      });
    }
  };

  // ================= STAFF =================

  const handleCreateDocumentStaff = async () => {
    if (!selectedFile) throw new Error("File wajib diisi");

    const token = await SecureStore.getItemAsync("token");
    const fd = new FormData();

    fd.append("subject", formData.subject);

    // @ts-ignore
    fd.append("file", {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType,
    });

    const res = await fetch(`${API_URL}/api/document_staff`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) throw new Error("Gagal upload dokumen staff");
    return res.json();
  };

  const handleUpdateDocumentStaff = async () => {
    const token = await SecureStore.getItemAsync("token");
    const fd = new FormData();

    fd.append("subject", formData.subject);

    if (selectedFile) {
      // @ts-ignore
      fd.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      });
    }

    const res = await fetch(`${API_URL}/api/document_staff/${editData.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) throw new Error("Gagal update dokumen staff");
    return res.json();
  };

  // ================= NON STAFF =================

  const handleCreateDocument = async () => {
    if (!selectedFile) throw new Error("File wajib diisi");

    const token = await SecureStore.getItemAsync("token");
    const formDataToSend = new FormData();

    formDataToSend.append("sender", formData.sender || "");
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("letter_type", formData.letter_type || "masuk");

    // @ts-ignore
    formDataToSend.append("file", {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType,
    });

    const response = await fetch(`${API_URL}/api/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formDataToSend,
    });

    if (!response.ok) throw new Error("Gagal upload dokumen");
    return await response.json();
  };

  const handleUpdateDocument = async () => {
    const token = await SecureStore.getItemAsync("token");

    const formDataToSend = new FormData();
    formDataToSend.append("sender", formData.sender || "");
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("letter_type", formData.letter_type || "masuk");

    if (selectedFile) {
      // @ts-ignore
      formDataToSend.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      });
    }

    const response = await fetch(`${API_URL}/api/documents/${editData.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: formData.sender,
        subject: formData.subject,
        letter_type: formData.letter_type,
      }),
    });

    if (!response.ok) throw new Error("Gagal update dokumen");
    return await response.json();
  };

  // ================= SUBMIT =================

  const handleSubmit = async () => {
    if (!editData && !selectedFile) {
      setLogMessage({
        type: "error",
        message: "File wajib diisi",
      });

      return;
    }

    setUploadingForm(true);

    try {
      if (isStaffDocument) {
        if (isEdit) {
          await handleUpdateDocumentStaff();
        } else {
          await handleCreateDocumentStaff();
        }
      } else {
        if (isEdit) {
          await handleUpdateDocument();
        } else {
          await handleCreateDocument();
        }
      }

      setLogMessage({
        type: "success",
        message: isEdit
          ? "Dokumen berhasil diupdate"
          : "Dokumen berhasil diupload",
      });
      console.log(
        "DocumentsForm: upload/update berhasil, prepare to navigate back",
        {
          isEdit,
          isStaffDocument,
          editDataId: editData?.id || null,
        }
      );

      // beri sedikit delay lalu kembali — tambah log sebelum & sesudah
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

  if (!isInitialized) {
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
            {isEdit ? "Edit Dokumen" : "Upload Dokumen"}
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
              {/* File picker selalu ditampilkan */}
              {!isEdit && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>File Dokumen</Text>
                  <TouchableOpacity
                    style={[
                      styles.filePicker,
                      !selectedFile && styles.filePickerEmpty,
                    ]}
                    onPress={handleFilePick}
                  >
                    <Text style={styles.filePickerText}>
                      {selectedFile ? selectedFile.name : "Pilih File..."}
                    </Text>
                    <Text style={styles.filePickerHint}>
                      {selectedFile
                        ? "Tap untuk mengganti file"
                        : "Format: PDF, JPG, PNG, GIF"}
                    </Text>
                  </TouchableOpacity>
                  {!editData && !selectedFile && (
                    <Text style={styles.requiredHint}>
                      * File wajib diisi untuk dokumen baru
                    </Text>
                  )}
                </View>
              )}

              {/* Input subject selalu ditampilkan */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Perihal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan perihal dokumen"
                  placeholderTextColor="#999"
                  value={formData.subject}
                  onChangeText={(text) =>
                    setFormData({ ...formData, subject: text })
                  }
                />
              </View>

              {/* Hanya tampilkan field berikut jika bukan staff document */}
              {!isStaffDocument && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Pengirim</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Masukkan pengirim dokumen"
                      placeholderTextColor="#999"
                      value={formData.sender || ""}
                      onChangeText={(text) =>
                        setFormData({ ...formData, sender: text })
                      }
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Tipe Surat</Text>
                    <View style={styles.radioGroup}>
                      {["masuk", "keluar"].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.radioOption}
                          onPress={() =>
                            setFormData({
                              ...formData,
                              letter_type: type as any,
                            })
                          }
                        >
                          <View style={styles.radioCircle}>
                            {formData.letter_type === type && (
                              <View style={styles.radioSelected} />
                            )}
                          </View>
                          <Text style={styles.radioText}>
                            {type === "masuk" ? "Surat Masuk" : "Surat Keluar"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
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
                    !selectedFile && !editData && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={uploadingForm || (!selectedFile && !editData)}
                >
                  {uploadingForm ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editData ? "Update" : "Upload"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Styles diubah untuk halaman penuh
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
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
    width: 40, // Untuk balance dengan back button
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
  filePicker: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0055A5",
    borderStyle: "dashed",
    alignItems: "center",
  },
  filePickerEmpty: {
    borderColor: "#dee2e6",
  },
  filePickerText: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  filePickerHint: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
    textAlign: "center",
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
