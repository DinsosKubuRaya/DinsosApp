import { API_URL } from "@/config/apiConfig";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Import DocumentPreview
import DocumentPreview from "@/components/DocumentPreview";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  link: string; // Sekarang ini berisi file_url langsung (URL Cloudinary)
  created_at: string;
}

// Interface untuk data dokumen yang akan dipreview
interface PreviewDocument {
  file_url: string;
  file_name: string;
  file_type?: string;
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // State untuk DocumentPreview
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        const token = await SecureStore.getItemAsync("token");

        const currentPage = reset ? 1 : page;

        const response = await fetch(
          `${API_URL}/api/notifications?page=${currentPage}&limit=15`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        // Fungsi untuk menghapus duplikat berdasarkan ID
        const removeDuplicates = (arr: Notification[]) => {
          const seen = new Set();
          return arr.filter((item) => {
            if (seen.has(item.id)) {
              console.warn(`Duplikat ID ditemukan: ${item.id}`);
              return false;
            }
            seen.add(item.id);
            return true;
          });
        };

        const uniqueNotifications = removeDuplicates(data.notifications || []);

        if (reset) {
          setNotifications(uniqueNotifications);
        } else {
          // Gabungkan dan pastikan tidak ada duplikat
          setNotifications((prev) => {
            const combined = [...prev, ...uniqueNotifications];
            return removeDuplicates(combined);
          });
        }

        setUnreadCount(data.unread_count || 0);
        setHasMore(data.has_more || false);

        if (reset) setPage(1);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [page]
  );

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const loadMore = () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    setPage((prev) => prev + 1);
    fetchNotifications(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Fungsi untuk membaca semua pesan dengan satu klik
  const readAllMessages = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      // Kirim request untuk menandai SEMUA notifikasi sebagai dibaca
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Kosongkan body karena backend akan menangani semua notifikasi user
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        // Update semua notifikasi di state menjadi sudah dibaca
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        Alert.alert("Sukses", "Semua notifikasi telah ditandai sebagai dibaca");
      } else {
        throw new Error(
          data.error || "Gagal menandai semua pesan sebagai dibaca"
        );
      }
    } catch (error: any) {
      console.error("Error reading all messages:", error);
      Alert.alert(
        "Error",
        error.message || "Gagal menandai semua pesan sebagai dibaca"
      );
    }
  };

  // Fungsi untuk mengekstrak nama file dari message notifikasi
  const extractFileNameFromMessage = (message: string): string => {
    // Coba cari pola seperti "Mengunggah dokumen: nama_file"
    const patterns = [
      /Mengunggah dokumen:\s*(.+)/,
      /Memperbarui dokumen:\s*(.+)/,
      /dokumen baru diunggah:\s*(.+)/i,
      /dokumen staff:\s*(.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Jika tidak ditemukan, gunakan nama default berdasarkan tanggal
    return `Document_${new Date().getTime()}`;
  };

  // Fungsi untuk mengekstrak nama file dari URL Cloudinary
  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // Decode URL encoded characters
      const decodedName = decodeURIComponent(lastPart);
      
      // Hapus parameter versi jika ada
      const cleanName = decodedName.split('?')[0];
      
      return cleanName || 'document';
    } catch {
      return 'document';
    }
  };

  // Fungsi untuk menangani tap pada notifikasi
  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Tandai sebagai sudah dibaca
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Handle navigation based on link
      if (notification.link) {
        // PERUBAHAN BESAR: Sekarang link adalah file_url langsung (Cloudinary URL)
        // Cek jika link adalah URL file (Cloudinary)
        if (notification.link.startsWith('http') && 
            (notification.link.includes('cloudinary') || 
             notification.link.includes('res.cloudinary.com'))) {
          
          setLoadingDocument(true);
          
          // Ekstrak nama file dari message notifikasi atau URL
          let fileName = extractFileNameFromMessage(notification.message);
          
          // Jika tidak berhasil ekstrak dari message, coba dari URL
          if (fileName.includes('Document_')) {
            fileName = getFileNameFromUrl(notification.link);
          }
          
          // Tentukan tipe file berdasarkan ekstensi
          const getFileTypeFromUrl = (url: string): string => {
            const ext = url.toLowerCase().split('.').pop();
            if (!ext) return 'other';
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
            if (ext === 'pdf') return 'pdf';
            if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) return 'document';
            return 'other';
          };
          
          const fileType = getFileTypeFromUrl(notification.link);
          
          // Langsung buka preview dengan data yang sudah ada
          setPreviewDocument({
            file_url: notification.link, // URL Cloudinary langsung
            file_name: fileName,
            file_type: fileType,
          });
          
          setShowPreview(true);
          setLoadingDocument(false);
          
        } else if (notification.link.includes('/documents/') || 
                  notification.link.includes('/document_staff/')) {
          // Fallback untuk kompatibilitas: jika link masih berupa path ID
          // (Tidak perlu lagi fetch data karena sudah diubah ke file_url langsung)
          Alert.alert(
            "Info", 
            "Notifikasi ini menggunakan format lama. Silakan refresh halaman untuk mendapatkan notifikasi terbaru."
          );
        } else {
          // Untuk link lainnya (path halaman), lakukan navigasi biasa
          const path = notification.link.startsWith("/")
            ? notification.link
            : `/${notification.link}`;
          router.push(path as any);
        }
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memproses notifikasi");
      setLoadingDocument(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Baru saja";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`;
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  const decodeFileName = (fileName: string) => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  // Fungsi untuk tombol kembali
  const handleBack = () => {
    router.back();
  };

  // Fungsi untuk mengecek apakah link adalah URL file (Cloudinary)
  const isCloudinaryFileLink = (link: string): boolean => {
    return link.startsWith('http') && 
           (link.includes('cloudinary') || link.includes('res.cloudinary.com'));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text style={styles.loadingText}>Memuat notifikasi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "white" }}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.container}>
          {/* Header dengan tombol kembali */}
          <View style={styles.header}>
            {/* LEFT */}
            <View style={styles.headerSide}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={22} color="#0066ff" />
                <Text style={styles.backButtonLabel}>Kembali</Text>
              </TouchableOpacity>
            </View>

            {/* CENTER TITLE */}
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {unreadCount > 0 ? `Notifikasi (${unreadCount})` : "Notifikasi"}
              </Text>
            </View>

            {/* RIGHT */}
            <View style={styles.headerSideRight}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={readAllMessages}
                  style={styles.readAllButton}
                >
                  <Text style={styles.readAllText}>Baca Semua</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading Overlay untuk Document */}
          {loadingDocument && (
            <View style={styles.documentLoadingOverlay}>
              <View style={styles.documentLoadingContainer}>
                <ActivityIndicator size="large" color="#0066ff" />
                <Text style={styles.documentLoadingText}>
                  Membuka dokumen...
                </Text>
              </View>
            </View>
          )}

          {/* Notifications List */}
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => {
              return item.id || `notification-${index}`;
            }}
            style={styles.notificationsList}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tidak ada notifikasi</Text>
                <Text style={styles.emptySubtext}>
                  Notifikasi baru akan muncul di sini
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  !item.is_read && styles.unreadNotification,
                ]}
                onPress={() => handleNotificationPress(item)}
                disabled={loadingDocument}
              >
                <View style={styles.notificationContent}>
                  <Text
                    style={[
                      styles.notificationMessage,
                      !item.is_read && styles.unreadMessage,
                    ]}
                  >
                    {decodeFileName(item.message)}
                  </Text>

                  <Text style={styles.notificationDate}>
                    {formatDate(item.created_at)}
                  </Text>

                  {/* PERUBAHAN: Tampilkan indikator file jika link adalah URL Cloudinary */}
                  {isCloudinaryFileLink(item.link) && (
                    <Text style={styles.documentIndicator}>
                      📎 Tap untuk melihat dokumen
                    </Text>
                  )}
                </View>

                {!item.is_read && <View style={styles.unreadDot} />}

                <View style={styles.statusIndicator}>
                  {item.is_read ? (
                    <Text style={styles.readStatus}>✓</Text>
                  ) : (
                    <Text style={styles.unreadStatus}>●</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color="#0066ff" />
              ) : null
            }
          />

          {/* Document Preview Modal */}
          <DocumentPreview
            visible={showPreview}
            onClose={closePreview}
            document={previewDocument}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingTop: 55,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    minWidth: 80,
  },
  backButtonText: {
    color: "#0066ff",
    fontSize: 18,
  },
  backButtonLabel: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#0066ff",
  },
  headerSide: {
    minWidth: 90,
    justifyContent: "flex-start",
  },
  headerSideRight: {
    minWidth: 90,
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PoppinsBold",
    color: "#1a1a1a",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 80,
    justifyContent: "flex-end",
  },
  readAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#28a745",
    borderRadius: 6,
  },
  readAllText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "PoppinsMedium",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#0066ff",
    borderRadius: 6,
  },
  markAllText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "PoppinsMedium",
  },
  notificationsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "PoppinsBold",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#999",
    textAlign: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
    paddingHorizontal: 20,
    position: "relative",
  },
  unreadNotification: {
    backgroundColor: "#f8fbff",
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#666",
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadMessage: {
    color: "#1a1a1a",
    fontFamily: "PoppinsMedium",
  },
  notificationDate: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#999",
    marginBottom: 4,
  },
  documentIndicator: {
    fontSize: 11,
    fontFamily: "PoppinsMedium",
    color: "#0066ff",
    fontStyle: "italic",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
    position: "absolute",
    top: 12,
    right: 12,
  },
  statusIndicator: {
    marginLeft: 8,
    width: 20,
    alignItems: "center",
  },
  readStatus: {
    fontSize: 14,
    color: "#28a745",
  },
  unreadStatus: {
    fontSize: 8,
    color: "#ff3b30",
  },
  documentLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  documentLoadingContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  documentLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
});