import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Alert from "@/components/Alert";
import DocumentPreview from "@/components/DocumentPreview";
import Log from "@/components/Log";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface DocumentStaff {
  id: string;
  file_name: string;
  file_url: string;
  subject: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
  };
}

export default function PersonalPage() {
  const [documentStaff, setDocumentStaff] = useState<DocumentStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentStaff | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{
    file_url: string;
    file_name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchPersonalDocuments = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      // Ambil data document staff milik user yang login
      const response = await fetch(`${API_URL}/api/document_staff/personal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil data dokumen pribadi");

      const data = await response.json();
      setDocumentStaff(data.documents || []);
    } catch (error: any) {
      console.error("Error fetching personal documents:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal memuat data dokumen pribadi",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("DocumentPage: screen focused -> calling fetchPersonalDocuments()");
      setLoading(true);
      fetchPersonalDocuments();
      return () => {
        console.log("DocumentPage: screen unfocused");
      };
    }, [])
  );

  useEffect(() => {
    fetchPersonalDocuments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPersonalDocuments();
  };

  const handleDeleteDocument = (document: DocumentStaff) => {
    setDocumentToDelete(document);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocument(documentToDelete.id);
    }
    setShowDeleteAlert(false);
    setDocumentToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteAlert(false);
    setDocumentToDelete(null);
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(
        `${API_URL}/api/document_staff/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menghapus dokumen pribadi");
      }

      setLogMessage({
        type: "success",
        message: "Dokumen pribadi berhasil dihapus",
      });
      fetchPersonalDocuments();
    } catch (error: any) {
      console.error("Delete personal document error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal menghapus dokumen pribadi",
      });
    }
  };

  const openPreview = (document: DocumentStaff) => {
    setPreviewDocument({
      file_url: document.file_url,
      file_name: document.file_name,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const decodeFileName = (fileName: string) => {
    if (!fileName) return "File tanpa nama";
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  const getFilteredDocuments = () => {
    if (!searchQuery) return documentStaff;

    const query = searchQuery.toLowerCase();
    return documentStaff.filter((doc) => {
      const fileName = (doc.file_name || "").toLowerCase();
      const subject = (doc.subject || "").toLowerCase();

      return fileName.includes(query) || subject.includes(query);
    });
  };

  const filteredDocuments = getFilteredDocuments();

  const handleUploadDocumentStaff = () => {
    router.push({
      pathname: "/form/DocumentsForm",
      params: {
        isStaffDocument: "true",
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>Memuat data dokumen pribadi...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar />

      <View style={styles.floatingLogContainer}>
        {logMessage && (
          <Log
            type={logMessage.type}
            message={logMessage.message}
            onHide={() => setLogMessage(null)}
          />
        )}
      </View>

      {/* Tambahkan KeyboardAvoidingView di sini */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent} // Ganti ke scrollContent
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Dokumen Pribadi</Text>
            <Text style={styles.subtitle}>Kelola dokumen pribadi Anda</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{documentStaff.length}</Text>
              <Text style={styles.statLabel}>Total Dokumen</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari dokumen pribadi..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleUploadDocumentStaff}
            >
              <Text style={styles.addButtonText}>+ Upload Dokumen Pribadi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.documentsList}>
            {filteredDocuments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? "Tidak ada dokumen yang sesuai dengan pencarian"
                    : "Belum ada dokumen pribadi"}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery
                    ? "Coba dengan kata kunci lain"
                    : "Tekan Upload Dokumen Pribadi untuk menambahkan dokumen pertama Anda"}
                </Text>
              </View>
            ) : (
              filteredDocuments.map((document) => (
                <View key={document.id} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <Text style={styles.fileName} numberOfLines={2}>
                      📎 {decodeFileName(document.file_name)}
                    </Text>
                  </View>
                  <View style={styles.documentInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Perihal:</Text>
                      <Text style={styles.infoValue}>
                        {document.subject || "-"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal:</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(document.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => openPreview(document)}
                    >
                      <Text style={styles.previewButtonText}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        router.push({
                          pathname: "/form/DocumentsForm",
                          params: {
                            isStaffDocument: "true",
                            editData: JSON.stringify(document),
                          },
                        });
                      }}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDocument(document)}
                    >
                      <Text style={styles.deleteButtonText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DocumentPreview
        visible={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
      />

      {showDeleteAlert && documentToDelete && (
        <Alert
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus dokumen pribadi "${decodeFileName(
            documentToDelete.file_name
          )}"?`}
          onYes={confirmDelete}
          onNo={cancelDelete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  floatingLogContainer: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "PoppinsBold",
    color: "#0055A5",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 12,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
  clearSearch: {
    fontSize: 16,
    color: "#666",
    padding: 4,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#0055A5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
  documentsList: {
    flex: 1,
  },
  documentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#0055A5",
  },
  documentHeader: {
    marginBottom: 12,
  },
  fileName: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: "#333",
    lineHeight: 22,
  },
  documentInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
    width: 80,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#333",
    flex: 1,
  },
  documentActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#17a2b8",
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffc107",
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#333",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#dc3545",
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: "PoppinsMedium",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#999",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#666",
  },
});
