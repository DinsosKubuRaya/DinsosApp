import React, { useEffect, useMemo, useState } from "react"; // Tambahkan useMemo
import {
  ActivityIndicator,
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
import DocumentsForm from "@/components/DocumentsForm";
import Log from "@/components/Log";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
import * as SecureStore from "expo-secure-store";

interface DocumentStaff {
  id: string;
  file_name: string;
  file_url: string;
  subject: string;
  user_id: string;
  user: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function DocumentStaffPage() {
  const [documentStaff, setDocumentStaff] = useState<DocumentStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentStaff | null>(
    null
  );
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentStaff | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentStaff | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian

  // Fungsi helper yang digunakan di useMemo harus didefinisikan sebelum useMemo
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().includes(".pdf")) return "📄";
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "🖼️";
    return "📎";
  };

  const decodeFileName = (fileName: string) => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  // Fetch document staff hanya untuk user yang login
  const fetchDocumentStaff = React.useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const storedUserId = await SecureStore.getItemAsync("user_id");

      if (!token || !storedUserId) {
        setLogMessage({
          type: "error",
          message: "User tidak terautentikasi",
        });
        setLoading(false);
        return;
      }

      setUserId(storedUserId);

      // Hanya ambil dokumen untuk user yang login
      const response = await fetch(
        `${API_URL}/api/document_staff?user_id=${storedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gagal mengambil data document staff: ${response.status}`
        );
      }

      const data = await response.json();
      setDocumentStaff(data.documents || []);
    } catch (error: any) {
      console.error("Error fetching document staff:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal memuat data document staff",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      console.log("User login terdeteksi:", userId);
    }
    fetchDocumentStaff();
  }, [fetchDocumentStaff, userId]);

  // Fungsi untuk memfilter dokumen berdasarkan pencarian
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return documentStaff;
    }

    const query = searchQuery.toLowerCase();
    return documentStaff.filter(
      (doc) =>
        doc.file_name.toLowerCase().includes(query) ||
        doc.subject.toLowerCase().includes(query) ||
        (doc.user?.name && doc.user.name.toLowerCase().includes(query)) ||
        formatDate(doc.created_at).toLowerCase().includes(query)
    );
  }, [documentStaff, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocumentStaff();
  };

  const handleFormSubmit = async (result: any) => {
    if (result.success) {
      setShowForm(false);
      setLogMessage({
        type: "success",
        message: result.message,
      });
      fetchDocumentStaff();
    } else {
      setLogMessage({
        type: "error",
        message: result.message,
      });
    }
  };

  const handleDeleteDocument = (document: DocumentStaff) => {
    setDocumentToDelete(document);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocumentStaff(documentToDelete.id);
    }
    setShowDeleteAlert(false);
    setDocumentToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteAlert(false);
    setDocumentToDelete(null);
  };

  const deleteDocumentStaff = async (documentId: string) => {
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
        throw new Error("Gagal menghapus document staff");
      }

      setLogMessage({
        type: "success",
        message: "Document staff berhasil dihapus",
      });
      fetchDocumentStaff();
    } catch (error: any) {
      console.error("Delete document staff error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal menghapus document staff",
      });
    }
  };

  const openEditForm = (document: DocumentStaff) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const openPreview = (document: DocumentStaff) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>Memuat data document staff...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar />

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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dokumen</Text>
          <Text style={styles.subtitle}>Kelola dokumen pribadi Anda</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{documentStaff.length}</Text>
            <Text style={styles.statLabel}>Total Dokumen</Text>
          </View>          
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari dokumen (nama, perihal, tanggal)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingDocument(null);
              setShowForm(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Upload Document Staff</Text>
          </TouchableOpacity>
        </View>

        {/* Documents List */}
        <View style={styles.documentsList}>
          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery.trim() !== ""
                  ? `Tidak ditemukan dokumen untuk pencarian: "${searchQuery}"`
                  : "Belum ada document staff"}
              </Text>
              {searchQuery.trim() !== "" && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={styles.clearSearchButtonText}>
                    Tampilkan semua dokumen
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredDocuments.map((document) => (
              <View key={document.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentTitle}>
                    <Text style={styles.fileIcon}>
                      {getFileIcon(document.file_name)}
                    </Text>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {decodeFileName(document.file_name)}
                    </Text>
                  </View>
                </View>
                <View style={styles.documentInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Perihal:</Text>
                    <Text style={styles.infoValue}>{document.subject}</Text>
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
                    onPress={() => openEditForm(document)}
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

      {/* DocumentsForm Component */}
      <DocumentsForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingDocument(null);
        }}
        onSubmit={handleFormSubmit}
        editData={editingDocument}
        title="Document Staff"
        isStaffDocument={true}
      />

      <DocumentPreview
        visible={showPreview}
        onClose={closePreview}
        document={previewDocument}
      />

      {/* Delete Confirmation Alert */}
      {showDeleteAlert && documentToDelete && (
        <Alert
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus document staff "${decodeFileName(
            documentToDelete?.file_name || ""
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
    padding: 20,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#333",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 20,
    color: "#999",
    fontFamily: "PoppinsBold",
  },
  searchInfoContainer: {
    backgroundColor: "#e8f4fd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0055A5",
  },
  searchInfoText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#0055A5",
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
    paddingBottom: 25,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  documentTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fileName: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: "#333",
    flex: 1,
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
    width: 100,
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
    flexWrap: "wrap",
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
  emptyState: {
    backgroundColor: "#f8f9fa",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  clearSearchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#0055A5",
    borderRadius: 6,
  },
  clearSearchButtonText: {
    color: "white",
    fontSize: 12,
    fontFamily: "PoppinsMedium",
  },
});