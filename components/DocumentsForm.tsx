import { API_URL } from "@/config/apiConfig";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// DIUBAH: Buat sender dan letter_type menjadi optional
interface DocumentFormData {
  sender?: string;
  subject: string;
  letter_type?: "masuk" | "keluar";
  file?: any;
}

interface DocumentsFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: {
    success: boolean;
    message: string;
    data?: any;
    error?: any;
  }) => void;
  editData: any;
  title?: string;
  isStaffDocument?: boolean;
}

export default function DocumentsForm({
  visible,
  onClose,
  onSubmit,
  editData,
  title,
  isStaffDocument = false,
}: DocumentsFormProps) {
  const [formData, setFormData] = useState<DocumentFormData>({
    sender: "",
    subject: "",
    letter_type: "masuk",
  });
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadingForm, setUploadingForm] = useState(false);

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (visible) {
      if (editData) {
        setFormData({
          sender: editData.sender || "",
          subject: editData.subject,
          letter_type: editData.letter_type || "masuk",
        });
      } else {
        setFormData({
          sender: "",
          subject: "",
          letter_type: "masuk",
        });
      }
      setSelectedFile(null);
    }
  }, [visible, editData]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
    } catch (error) {
      console.error("Error picking file:", error);
    }
  };

  // FUNGSI BARU: Handle create document staff
  const handleCreateDocumentStaff = async (formData: DocumentFormData) => {
    if (!formData.file) {
      throw new Error("Harap pilih file terlebih dahulu");
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const formDataToSend = new FormData();

      // PERBAIKAN: Kirim nilai default untuk sender dan letter_type
      formDataToSend.append("sender", "Staff Internal"); // Nilai default
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("letter_type", "masuk"); // Nilai default

      // @ts-ignore
      formDataToSend.append("file", {
        uri: formData.file.uri,
        name: formData.file.name,
        type: formData.file.mimeType,
      });

      const response = await fetch(`${API_URL}/api/document_staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat document staff");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Create document staff error:", error);
      throw error;
    }
  };

  // FUNGSI BARU: Handle update document staff
  const handleUpdateDocumentStaff = async (
    formData: DocumentFormData,
    documentId: string
  ) => {
    try {
      const token = await SecureStore.getItemAsync("token");

      // GUNAKAN FormData UNTUK KONSISTENSI
      const formDataToSend = new FormData();

      // Tambahkan field subject
      formDataToSend.append("subject", formData.subject);

      // Jika ada file baru, tambahkan ke FormData
      if (selectedFile) {
        // @ts-ignore
        formDataToSend.append("file", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
        });
      }

      const response = await fetch(
        `${API_URL}/api/document_staff/${documentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // JANGAN set Content-Type, biar React Native yang handle boundary
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate document staff");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Update document staff error:", error);
      throw error;
    }
  };

  // FUNGSI BARU: Handle create regular document
  const handleCreateDocument = async (formData: DocumentFormData) => {
    if (!formData.file) {
      throw new Error("Harap pilih file terlebih dahulu");
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const formDataToSend = new FormData();

      formDataToSend.append("sender", formData.sender || "");
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("letter_type", formData.letter_type || "masuk");

      // @ts-ignore
      formDataToSend.append("file", {
        uri: formData.file.uri,
        name: formData.file.name,
        type: formData.file.mimeType,
      });

      const response = await fetch(`${API_URL}/api/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat dokumen");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Create document error:", error);
      throw error;
    }
  };

  // FUNGSI BARU: Handle update regular document
  const handleUpdateDocument = async (
    formData: DocumentFormData,
    documentId: string
  ) => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const dataToSend = {
        sender: formData.sender || "",
        subject: formData.subject,
        letter_type: formData.letter_type || "masuk",
      };

      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate dokumen");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Update document error:", error);
      throw error;
    }
  };

  // FUNGSI UTAMA: Handle submit form
  const handleSubmit = async () => {
    if (!editData && !selectedFile) {
      return;
    }

    setUploadingForm(true);

    try {
      let result;

      if (isStaffDocument) {
        // Untuk staff document
        if (editData) {
          // Update document staff
          result = await handleUpdateDocumentStaff(formData, editData.id);
        } else {
          // Create document staff
          result = await handleCreateDocumentStaff({
            ...formData,
            file: selectedFile,
          });
        }
      } else {
        // Untuk document reguler
        if (editData) {
          // Update document reguler
          result = await handleUpdateDocument(formData, editData.id);
        } else {
          // Create document reguler
          result = await handleCreateDocument({
            ...formData,
            file: selectedFile,
          });
        }
      }

      // Panggil callback onSubmit dengan data yang diperlukan
      onSubmit({
        success: true,
        message: editData
          ? `${title || "Dokumen"} berhasil diupdate`
          : `${title || "Dokumen"} berhasil dibuat`,
        data: result,
      });
    } catch (error: any) {
      // Panggil callback onSubmit dengan error
      onSubmit({
        success: false,
        message:
          error.message ||
          `Gagal ${editData ? "mengupdate" : "membuat"} ${title || "dokumen"}`,
        error: error,
      });
    } finally {
      setUploadingForm(false);
    }
  };

  const handleClose = () => {
    setFormData({
      sender: "",
      subject: "",
      letter_type: "masuk",
    });
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editData
              ? `Edit ${title || "Dokumen"}`
              : `Upload ${title || "Dokumen"} Baru`}
          </Text>

          {/* File picker selalu ditampilkan */}
          <TouchableOpacity
            style={[styles.filePicker, !selectedFile && styles.filePickerEmpty]}
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

          {/* Input subject selalu ditampilkan */}
          <TextInput
            style={styles.input}
            placeholder="Perihal"
            placeholderTextColor="#999"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
          />

          {/* Hanya tampilkan field berikut jika bukan staff document */}
          {!isStaffDocument && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Pengirim"
                placeholderTextColor="#999"
                value={formData.sender || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, sender: text })
                }
              />

              <View style={styles.radioGroup}>
                <Text style={styles.radioLabel}>Tipe Surat:</Text>
                {["masuk", "keluar"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() =>
                      setFormData({ ...formData, letter_type: type as any })
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
            </>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
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
      </View>
    </Modal>
  );
}

// Styles tetap sama...
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  filePicker: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  radioGroup: {
    marginBottom: 32,
  },
  radioLabel: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#333",
    marginBottom: 16,
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
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
