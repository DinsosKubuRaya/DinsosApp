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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface Document {
  id: string;
  sender: string;
  file_name: string;
  file_url: string;
  subject: string;
  letter_type: "masuk" | "keluar";
  user_id: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [letterTypeFilter, setLetterTypeFilter] = useState<
    "all" | "masuk" | "keluar"
  >("all");
  const [senderFilter, setSenderFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();

  // Fetch documents
  const fetchDocuments = React.useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      let url = `${API_URL}/api/documents`;

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (letterTypeFilter !== "all")
        params.append("letter_type", letterTypeFilter);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data dokumen: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal memuat data dokumen",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, letterTypeFilter]);

  useFocusEffect(
    useCallback(() => {
      console.log("DocumentPage: screen focused -> calling fetchDocuments()");
      setLoading(true);
      fetchDocuments();
      return () => {
        console.log("DocumentPage: screen unfocused");
      };
    }, [fetchDocuments])
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments();
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, letterTypeFilter, fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const handleDeleteDocument = (document: Document) => {
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
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus dokumen");
      }

      setLogMessage({
        type: "success",
        message: "Dokumen berhasil dihapus",
      });
      fetchDocuments();
    } catch (error: any) {
      console.error("Delete document error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal menghapus dokumen",
      });
    }
  };

  const openEditForm = (document: Document) => {
    router.push({
      pathname: "/form/DocumentsForm",
      params: {
        editData: JSON.stringify(document),
        isEdit: "true",
      },
    });
  };

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => {
        const fileName = (doc.file_name || "").toLowerCase();
        const subject = (doc.subject || "").toLowerCase();
        const sender = (doc.sender || "").toLowerCase();
        const userName = (doc.user_name || "").toLowerCase();

        return (
          fileName.includes(query) ||
          subject.includes(query) ||
          sender.includes(query) ||
          userName.includes(query)
        );
      });
    }

    if (letterTypeFilter !== "all") {
      filtered = filtered.filter((doc) => doc.letter_type === letterTypeFilter);
    }

    if (senderFilter) {
      const senderQuery = senderFilter.toLowerCase();
      filtered = filtered.filter((doc) =>
        (doc.sender || "").toLowerCase().includes(senderQuery)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((doc) => {
        if (!doc.created_at) return false;
        const docDate = new Date(doc.created_at).toISOString().split("T")[0];
        return docDate === dateFilter;
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  };

  const openPreview = (document: Document) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);

    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      setDateFilter(formattedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const clearDateFilter = () => {
    setDateFilter("");
    setSelectedDate(new Date());
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getLetterTypeColor = (type: string) => {
    switch (type) {
      case "masuk":
        return "#28a745";
      case "keluar":
        return "#dc3545";
      default:
        return "#6c757d";
    }
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

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().includes(".pdf")) return "📄";
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "🖼️";
    return "📎";
  };

  const decodeFileName = (fileName: string) => {
    if (!fileName) return "File tanpa nama";
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  const stats = {
    total: documents.length,
    masuk: documents.filter((d) => d.letter_type === "masuk").length,
    keluar: documents.filter((d) => d.letter_type === "keluar").length,
  };

  const filteredData = getFilteredDocuments();

  const handleUploadDocument = () => {
    router.push("/form/DocumentsForm");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>Memuat data dokumen...</Text>
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

      {/* KeyboardAvoidingView untuk handle keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Manajemen Dokumen</Text>
            <Text style={styles.subtitle}>Kelola dokumen masuk dan keluar</Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Dokumen</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.masuk}</Text>
              <Text style={styles.statLabel}>Masuk</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.keluar}</Text>
              <Text style={styles.statLabel}>Keluar</Text>
            </View>
          </View>

          {/* Search and Filter Bar */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          {showFilters && (
            <View style={styles.filtersContainer}>
              <Text style={styles.filterLabel}>Tipe Surat:</Text>
              <View style={styles.filterOptions}>
                {["all", "masuk", "keluar"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      letterTypeFilter === type && styles.filterOptionActive,
                    ]}
                    onPress={() => setLetterTypeFilter(type as any)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        letterTypeFilter === type &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {type === "all" ? "Semua" : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Pengirim:</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Cari berdasarkan pengirim..."
                value={senderFilter}
                onChangeText={setSenderFilter}
                placeholderTextColor="#999"
              />

              <Text style={styles.filterLabel}>Tanggal:</Text>
              <View style={styles.dateFilterContainer}>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={showDatepicker}
                >
                  <Text
                    style={[
                      styles.dateInputText,
                      !dateFilter && styles.dateInputPlaceholder,
                    ]}
                  >
                    {dateFilter
                      ? formatDisplayDate(dateFilter)
                      : "Pilih tanggal..."}
                  </Text>
                </TouchableOpacity>

                {dateFilter && (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={clearDateFilter}
                  >
                    <Text style={styles.clearDateButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                />
              )}

              {/* Tombol Reset Filter */}
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => {
                  setSenderFilter("");
                  setDateFilter("");
                  setSelectedDate(new Date());
                  setLetterTypeFilter("all");
                  setSearchQuery("");
                }}
              >
                <Text style={styles.resetFilterButtonText}>Reset Filter</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleUploadDocument}
            >
              <Text style={styles.addButtonText}>+ Upload Dokumen</Text>
            </TouchableOpacity>
          </View>

          {/* Documents List */}
          <View style={styles.documentsList}>
            {filteredData.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {documents.length === 0
                    ? "Belum ada dokumen"
                    : "Tidak ada dokumen yang sesuai dengan filter"}
                </Text>
              </View>
            ) : (
              filteredData.map((document: Document) => (
                <View key={document.id} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentTitle}>
                      <Text style={styles.fileIcon}>
                        {getFileIcon(document.file_name)}
                      </Text>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {decodeFileName(
                          document.file_name || "File tanpa nama"
                        )}
                      </Text>
                    </View>
                    {document.letter_type && (
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: getLetterTypeColor(
                              document.letter_type
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.typeText}>
                          {document.letter_type.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.documentInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pengirim:</Text>
                      <Text style={styles.infoValue}>{document.sender}</Text>
                    </View>
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
      </KeyboardAvoidingView>

      <DocumentPreview
        visible={showPreview}
        onClose={closePreview}
        document={previewDocument}
      />

      {/* Delete Confirmation Alert */}
      {showDeleteAlert && documentToDelete && (
        <Alert
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus dokumen "${decodeFileName(
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
  searchFilterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "Poppins",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  filterButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
  filtersContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  filterOptions: {
    flexDirection: "row",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#e9ecef",
  },
  filterOptionActive: {
    backgroundColor: "#0055A5",
  },
  filterOptionText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  filterOptionTextActive: {
    color: "white",
  },
  filterInput: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "Poppins",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 8,
  },
  resetFilterButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 16,
  },
  resetFilterButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
  dateFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
    justifyContent: "center",
  },
  dateInputText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
  dateInputPlaceholder: {
    color: "#999",
  },
  clearDateButton: {
    marginLeft: 8,
    backgroundColor: "#dc3545",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  clearDateButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "PoppinsBold",
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: "PoppinsBold",
    color: "white",
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
  },
});
