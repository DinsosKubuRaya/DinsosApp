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

import Alert from "@/components/Alert";
import DocumentPreview from "@/components/DocumentPreview";
import DocumentsForm from "@/components/DocumentsForm";
import Log from "@/components/Log";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
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

// Tambahkan interface untuk DocumentStaff
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

export default function DocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentStaff, setDocumentStaff] = useState<DocumentStaff[]>([]);
  const [activeTab, setActiveTab] = useState<"documents" | "staff">(
    "documents"
  );
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingDocumentStaff, setEditingDocumentStaff] =
    useState<DocumentStaff | null>(null);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [documentStaffToDelete, setDocumentStaffToDelete] =
    useState<DocumentStaff | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewDocumentStaff, setPreviewDocumentStaff] =
    useState<DocumentStaff | null>(null);

  // Filter states
  const [searchQueryStaff, setSearchQueryStaff] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [letterTypeFilter, setLetterTypeFilter] = useState<
    "all" | "masuk" | "keluar"
  >("all");
  const [senderFilter, setSenderFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [userFilter, setUserFilter] = useState<string>("all");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<
    { id: string; name: string }[]
  >([]);

  // Fetch documents biasa
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

  // Fetch document staff
  const fetchDocumentStaff = React.useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      let url = `${API_URL}/api/document_staff`;

      const params = new URLSearchParams();
      if (userFilter !== "all") params.append("user_id", userFilter);
      if (searchQueryStaff) params.append("search", searchQueryStaff);

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
      setLoadingStaff(false);
      setRefreshing(false);
    }
  }, [userFilter, searchQueryStaff]);

  const fetchUsers = React.useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_URL}/api/users/for-filter`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal memuat data users",
      });
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (activeTab === "documents") {
        fetchDocuments();
      } else {
        fetchDocumentStaff();
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [
    searchQuery,
    letterTypeFilter,
    userFilter,
    searchQueryStaff,
    activeTab,
    fetchDocuments,
    fetchDocumentStaff,
    fetchUsers,
    users.length,
  ]);

  const handleSearchUser = (text: string) => {
    setSearchUser(text);
    const lower = text.toLowerCase();
    const result = users.filter((u) => u.name.toLowerCase().includes(lower));
    setFilteredUsers(result);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === "documents") {
      fetchDocuments();
    } else {
      fetchDocumentStaff();
    }
  };

  const handleFormSubmit = async (result: any) => {
    if (result.success) {
      setShowForm(false);
      setLogMessage({
        type: "success",
        message: result.message,
      });

      // Refresh data berdasarkan tab aktif
      if (activeTab === "documents") {
        fetchDocuments();
      } else {
        fetchDocumentStaff();
      }
    } else {
      setLogMessage({
        type: "error",
        message: result.message,
      });
    }
  };

  // Modifikasi fungsi delete untuk handle kedua jenis
  const handleDeleteDocument = (document: any) => {
    if (activeTab === "documents") {
      setDocumentToDelete(document);
    } else {
      setDocumentStaffToDelete(document);
    }
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (activeTab === "documents" && documentToDelete) {
      await deleteDocument(documentToDelete.id);
    } else if (activeTab === "staff" && documentStaffToDelete) {
      await deleteDocumentStaff(documentStaffToDelete.id);
    }
    setShowDeleteAlert(false);
    setDocumentToDelete(null);
    setDocumentStaffToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteAlert(false);
    setDocumentToDelete(null);
    setDocumentStaffToDelete(null);
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

  // Fungsi delete untuk document staff
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

  // Modifikasi fungsi edit untuk handle kedua jenis
  const openEditForm = (document: any) => {
    if (activeTab === "documents") {
      setEditingDocument(document);
    } else {
      setEditingDocumentStaff(document);
    }
    setShowForm(true);
  };

  // Fungsi-fungsi helper yang tetap sama
  const getFilteredDocuments = () => {
    if (activeTab === "documents") {
      let filtered = documents;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((doc) => {
          // Gunakan optional chaining dan nullish coalescing untuk menghindari undefined
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
        )
        .slice(0, 10);
    } else {
      return documentStaff
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
        .slice(0, 10);
    }
  };

  const openPreview = (document: any) => {
    if (activeTab === "documents") {
      setPreviewDocument(document);
    } else {
      setPreviewDocumentStaff(document);
    }
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
    setPreviewDocumentStaff(null);
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

  // Fungsi untuk mendapatkan data yang akan diedit
  const getEditData = () => {
    if (activeTab === "documents") {
      return editingDocument;
    } else {
      return editingDocumentStaff;
    }
  };

  // Fungsi untuk mendapatkan statistik
  const getStats = () => {
    if (activeTab === "documents") {
      return {
        total: documents.length,
        masuk: documents.filter((d) => d.letter_type === "masuk").length,
        keluar: documents.filter((d) => d.letter_type === "keluar").length,
      };
    } else {
      // Untuk document staff, semua dianggap sebagai dokumen (tidak ada tipe masuk/keluar)
      return {
        total: documentStaff.length,
        masuk: 0, // Document staff tidak memiliki tipe
        keluar: 0, // Document staff tidak memiliki tipe
      };
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

  const stats = getStats();
  const filteredData = getFilteredDocuments();
  const isLoading = activeTab === "documents" ? loading : loadingStaff;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>
            {activeTab === "documents"
              ? "Memuat data dokumen..."
              : "Memuat data document staff..."}
          </Text>
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
          <Text style={styles.title}>Manajemen Dokumen</Text>
          <Text style={styles.subtitle}>Kelola dokumen masuk dan keluar</Text>
        </View>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "documents" && styles.activeTab]}
            onPress={() => setActiveTab("documents")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "documents" && styles.activeTabText,
              ]}
            >
              Documents
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "staff" && styles.activeTab]}
            onPress={() => setActiveTab("staff")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "staff" && styles.activeTabText,
              ]}
            >
              Document Staff
            </Text>
          </TouchableOpacity>
        </View>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>
              Total {activeTab === "documents" ? "Dokumen" : "Document Staff"}
            </Text>
          </View>
          {activeTab === "documents" && (
            <>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.masuk}</Text>
                <Text style={styles.statLabel}>Masuk</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.keluar}</Text>
                <Text style={styles.statLabel}>Keluar</Text>
              </View>
            </>
          )}
        </View>
        {/* Search and Filter Bar - Hanya untuk documents biasa */}
        {activeTab === "documents" && (
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* User Filter untuk Document Staff */}
        {activeTab === "staff" && (
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari document staff..."
                value={searchQueryStaff}
                onChangeText={setSearchQueryStaff}
              />
            </View>

            <TouchableOpacity
              style={styles.userFilterToggle}
              onPress={() => setShowUserDropdown(!showUserDropdown)}
            >
              <Text style={styles.userFilterToggleText}>
                {userFilter === "all" ? "Semua User" : "Filter User"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Filter Dropdown */}
        {activeTab === "staff" && showUserDropdown && (
          <View style={styles.userFilterDropdownContainer}>
            <View style={styles.userFilterHeader}>
              <Text style={styles.userFilterTitle}>
                Filter berdasarkan User
              </Text>
              <TouchableOpacity onPress={() => setShowUserDropdown(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownSearchContainer}>
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Cari user..."
                value={searchUser}
                onChangeText={handleSearchUser}
              />
            </View>

            <View style={styles.userOptionsContainer}>
              {/* List Users */}
              {filteredUsers.slice(0, 5).map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userOption,
                    userFilter === user.id && styles.userOptionActive,
                  ]}
                  onPress={() => {
                    setUserFilter(user.id);
                    setShowUserDropdown(false);
                  }}
                >
                  <View style={styles.userOptionContent}>
                    <Text
                      style={[
                        styles.userOptionText,
                        userFilter === user.id && styles.userOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {user.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* User Filter Info */}
        {activeTab === "staff" && userFilter !== "all" && (
          <View style={styles.activeFilterContainer}>
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>
                Menampilkan document staff untuk:{" "}
                <Text style={styles.activeFilterUser}>
                  {users.find((u) => u.id === userFilter)?.name || "User"}
                </Text>
              </Text>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setUserFilter("all")}
              >
                <Text style={styles.clearFilterText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Filters - Hanya untuk documents biasa */}
        {showFilters && activeTab === "documents" && (
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
          {activeTab === "documents" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingDocument(null);
                setShowForm(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Upload Dokumen</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Documents List */}
        <View style={styles.documentsList}>
          {filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === "documents"
                  ? documents.length === 0
                    ? "Belum ada dokumen"
                    : "Tidak ada dokumen yang sesuai dengan filter"
                  : documentStaff.length === 0
                  ? "Belum ada document staff"
                  : "Tidak ada document staff untuk user yang dipilih"}
              </Text>
            </View>
          ) : (
            filteredData.map((document: any) => (
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
                  {/* Hanya tampilkan badge untuk documents biasa */}
                  {activeTab === "documents" && document.letter_type && (
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
                  {activeTab === "documents" && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pengirim:</Text>
                      <Text style={styles.infoValue}>{document.sender}</Text>
                    </View>
                  )}
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

      {/* DocumentsForm Component */}
      <DocumentsForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingDocument(null);
          setEditingDocumentStaff(null);
        }}
        onSubmit={handleFormSubmit}
        editData={getEditData()}
        title={activeTab === "documents" ? "Dokumen" : "Document Staff"}
        isStaffDocument={activeTab === "staff"}
      />

      <DocumentPreview
        visible={showPreview}
        onClose={closePreview}
        document={previewDocument || previewDocumentStaff}
      />

      {/* Delete Confirmation Alert */}
      {showDeleteAlert && (documentToDelete || documentStaffToDelete) && (
        <Alert
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus ${
            activeTab === "documents" ? "dokumen" : "document staff"
          } "${decodeFileName(
            (documentToDelete || documentStaffToDelete)?.file_name || ""
          )}"?`}
          onYes={confirmDelete}
          onNo={cancelDelete}
        />
      )}
    </View>
  );
}

// Styles dengan tambahan untuk user filter
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
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#0055A5",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  limitInfo: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#0055A5",
    marginTop: 4,
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
  dropdownSearchInput: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "Poppins",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
  dropdown: {
    position: "absolute",
    top: 45,
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    zIndex: 99,
    paddingVertical: 8,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Poppins",
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
  // Container khusus untuk user filter di Document Staff
  userFilterContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  userFilterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  userFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#e9ecef",
    marginBottom: 8,
  },
  userFilterOptionActive: {
    backgroundColor: "#0055A5",
  },
  userFilterOptionText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  userFilterOptionTextActive: {
    color: "white",
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
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 8,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  dropdownOptions: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
    maxHeight: 200,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownOptionActive: {
    backgroundColor: "#0055A5",
  },
  dropdownOptionText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
  dropdownOptionTextActive: {
    color: "white",
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
    backgroundColor: "#17a2b8",
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
  downloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#28a745",
    borderRadius: 6,
  },
  downloadButtonText: {
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
  futureSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  futureTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 8,
  },
  futureSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#666",
    marginBottom: 16,
  },
  placeholderBox: {
    backgroundColor: "#f8f9fa",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#999",
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
  moreResults: {
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  moreResultsText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
    fontStyle: "italic",
  },
  userFilterToggle: {
    backgroundColor: "#0055A5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  userFilterToggleText: {
    color: "white",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
  userFilterDropdownContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  userFilterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userFilterTitle: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: "#333",
  },
  closeButton: {
    fontSize: 18,
    color: "#666",
    padding: 4,
  },
  dropdownSearchContainer: {
    marginBottom: 12,
  },
  userOptionsContainer: {
    maxHeight: 250,
  },
  userOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  userOptionActive: {
    backgroundColor: "#0055A5",
  },
  userOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  userOptionText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
    flex: 1,
  },
  userOptionTextActive: {
    color: "white",
    fontFamily: "PoppinsMedium",
  },
  moreUsersIndicator: {
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  moreUsersText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
    marginBottom: 4,
  },
  moreUsersHint: {
    fontSize: 10,
    fontFamily: "Poppins",
    color: "#999",
    textAlign: "center",
  },
  activeFilterContainer: {
    marginBottom: 16,
  },
  activeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e3f2fd",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0055A5",
  },
  activeFilterText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
    flex: 1,
  },
  activeFilterUser: {
    fontFamily: "PoppinsBold",
    color: "#0055A5",
  },
  clearFilterButton: {
    marginLeft: 12,
    padding: 4,
  },
  clearFilterText: {
    fontSize: 16,
    color: "#666",
    fontFamily: "PoppinsBold",
  },
});
