import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DocumentPreview from "@/components/DocumentPreview";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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

export default function LetterPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const [stats, setStats] = useState({
    total: 0,
    masuk: 0,
    keluar: 0,
  });

  // Fetch documents
  const fetchDocuments = React.useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      let url = `${API_URL}/api/documents`;

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (letterTypeFilter !== "all")
        params.append("letter_type", letterTypeFilter);
      if (senderFilter) params.append("sender", senderFilter);
      if (dateFilter) params.append("date", dateFilter);

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
        throw new Error(`Gagal mengambil data surat: ${response.status}`);
      }

      const data = await response.json();
      const docs = data.documents || [];
      setDocuments(docs);

      // Calculate statistics
      const masuk = docs.filter((d: Document) => d.letter_type === "masuk").length;
      const keluar = docs.filter((d: Document) => d.letter_type === "keluar").length;
      
      setStats({
        total: docs.length,
        masuk,
        keluar,
      });
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, letterTypeFilter, senderFilter, dateFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments();
    }, 500);

    return () => clearTimeout(handler);
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
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
      filtered = filtered.filter(
        (doc) => doc.letter_type === letterTypeFilter
      );
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

    return filtered
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
  };

  const filteredData = getFilteredDocuments();

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>
            Memuat data surat...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Manajemen Surat</Text>
          <Text style={styles.subtitle}>Kelola surat masuk dan keluar</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>
              Total Surat
            </Text>
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
            <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari surat..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Feather name="filter" size={18} color="white" />
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

        {/* Documents List */}
        <View style={styles.documentsList}>
          {filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={64} color="#CCD6DD" />
              <Text style={styles.emptyStateText}>
                {documents.length === 0
                  ? "Belum ada surat"
                  : "Tidak ada surat yang sesuai dengan filter"}
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
                      {decodeFileName(document.file_name || "File tanpa nama")}
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
                    <Feather name="eye" size={14} color="white" />
                    <Text style={styles.previewButtonText}> Preview</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <DocumentPreview
        visible={showPreview}
        onClose={closePreview}
        document={previewDocument}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  searchFilterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "Poppins",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flex: 1,
  },
  filterButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    backgroundColor: "#0055A5",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  previewButtonText: {
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
    marginTop: 12,
  },
});