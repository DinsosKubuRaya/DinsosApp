import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
  photo_url?: string;
}

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

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalStaff: number;
  recentUsers: User[];
  activeToday: number;
  totalDocuments: number;
  recentDocuments: Document[];
  documentsMasuk: number;
  documentsKeluar: number;
}

export default function SuperAdminHome() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const fetchUserName = async () => {
    try {
      const name = await SecureStore.getItemAsync("name");
      if (name) {
        setUserName(name);
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      await fetchUserName();

      // Fetch users data
      const usersResponse = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!usersResponse.ok) {
        throw new Error("Gagal mengambil data dashboard");
      }

      const usersData: User[] = await usersResponse.json();

      // Fetch documents data
      const documentsResponse = await fetch(
        `${API_URL}/api/documents?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const documentsData = documentsResponse.ok
        ? await documentsResponse.json()
        : { documents: [] };

      // Calculate stats
      const totalUsers = usersData.length;
      const totalAdmins = usersData.filter(
        (user) => user.role === "admin"
      ).length;
      const totalStaff = usersData.filter(
        (user) => user.role === "staff"
      ).length;

      // Documents stats
      const totalDocuments = documentsData.documents?.length || 0;
      const documentsMasuk =
        documentsData.documents?.filter(
          (doc: Document) => doc.letter_type === "masuk"
        ).length || 0;
      const documentsKeluar =
        documentsData.documents?.filter(
          (doc: Document) => doc.letter_type === "keluar"
        ).length || 0;

      // Get recent users (last 5)
      const recentUsers = usersData
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      // Get recent documents (last 3)
      const recentDocuments = (documentsData.documents || [])
        .sort(
          (a: Document, b: Document) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 3);

      // Mock data for active today
      const activeToday = Math.floor(Math.random() * totalUsers) + 1;

      setStats({
        totalUsers,
        totalAdmins,
        totalStaff,
        recentUsers,
        activeToday,
        totalDocuments,
        recentDocuments,
        documentsMasuk,
        documentsKeluar,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "#ff6b35";
      case "admin":
        return "#0055A5";
      case "staff":
        return "#28a745";
      default:
        return "#6c757d";
    }
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
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>Memuat dashboard...</Text>
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
        {/* Header Welcome */}
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>
            Selamat Datang, {userName || "SuperAdmin"}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Kelola dan pantau aktivitas sistem Anda
          </Text>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#e3f2fd" }]}>
              <Text style={[styles.statIconText, { color: "#0055A5" }]}>
                👥
              </Text>
            </View>
            <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#fff3cd" }]}>
              <Text style={[styles.statIconText, { color: "#856404" }]}>
                🛡️
              </Text>
            </View>
            <Text style={styles.statNumber}>{stats?.totalAdmins || 0}</Text>
            <Text style={styles.statLabel}>Admin</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#d1ecf1" }]}>
              <Text style={[styles.statIconText, { color: "#0c5460" }]}>
                👨‍💼
              </Text>
            </View>
            <Text style={styles.statNumber}>{stats?.totalStaff || 0}</Text>
            <Text style={styles.statLabel}>Staff</Text>
          </View>
        </View>

        {/* Documents Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Dokumen</Text>
          <View style={styles.documentsStatsGrid}>
            <View style={styles.documentStatCard}>
              <View
                style={[
                  styles.documentStatIcon,
                  { backgroundColor: "#e8f5e8" },
                ]}
              >
                <Text
                  style={[styles.documentStatIconText, { color: "#28a745" }]}
                >
                  📄
                </Text>
              </View>
              <View style={styles.documentStatInfo}>
                <Text style={styles.documentStatNumber}>
                  {stats?.totalDocuments || 0}
                </Text>
                <Text style={styles.documentStatLabel}>Total Dokumen</Text>
              </View>
            </View>

            <View style={styles.documentStatCard}>
              <View
                style={[
                  styles.documentStatIcon,
                  { backgroundColor: "#e8f4fd" },
                ]}
              >
                <Text
                  style={[styles.documentStatIconText, { color: "#0055A5" }]}
                >
                  📥
                </Text>
              </View>
              <View style={styles.documentStatInfo}>
                <Text style={styles.documentStatNumber}>
                  {stats?.documentsMasuk || 0}
                </Text>
                <Text style={styles.documentStatLabel}>Masuk</Text>
              </View>
            </View>

            <View style={styles.documentStatCard}>
              <View
                style={[
                  styles.documentStatIcon,
                  { backgroundColor: "#fde8e8" },
                ]}
              >
                <Text
                  style={[styles.documentStatIconText, { color: "#dc3545" }]}
                >
                  📤
                </Text>
              </View>
              <View style={styles.documentStatInfo}>
                <Text style={styles.documentStatNumber}>
                  {stats?.documentsKeluar || 0}
                </Text>
                <Text style={styles.documentStatLabel}>Keluar</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/superadmin-admin/users")}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Kelola Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/superadmin-admin/documents")}
            >
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionText}>Kelola Dokumen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/superadmin-admin/personal")}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Pribadi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dokumen</Text>
            <TouchableOpacity
              onPress={() => router.push("/superadmin-admin/documents")}
            >
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.documentsList}>
            {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
              stats.recentDocuments.map((document) => (
                <View key={document.id} style={styles.documentItem}>
                  <View style={styles.documentIcon}>
                    <Text style={styles.documentIconText}>
                      {getFileIcon(document.file_name)}
                    </Text>
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {decodeFileName(document.file_name)}
                    </Text>
                    <Text style={styles.documentDetail}>
                      {document.subject}
                    </Text>
                    <Text style={styles.documentDate}>
                      {formatDateTime(document.created_at)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.documentTypeBadge,
                      {
                        backgroundColor: getLetterTypeColor(
                          document.letter_type
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.documentTypeText}>
                      {document.letter_type.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Belum ada dokumen</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Terbaru</Text>
            <TouchableOpacity
              onPress={() => router.push("/superadmin-admin/users")}
            >
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentUsersList}>
            {stats?.recentUsers.map((user) => (
              <View key={user.id} style={styles.recentUserCard}>
                {/* Avatar */}
                <View style={styles.userAvatar}>
                  {user.photo_url ? (
                    <Image
                      source={{ uri: user.photo_url }}
                      style={{ width: "100%", height: "100%" }}
                      onError={() => console.log("Gambar tidak dapat dimuat")}
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#0055A5",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.avatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Info: Name + Date */}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userDateInline}>
                    {formatDate(user.created_at)}
                  </Text>
                </View>

                {/* Role di pojok kanan bawah */}
                <View style={styles.userMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleColor(user.role) },
                    ]}
                  >
                    <Text style={styles.roleText}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Belum ada user terdaftar
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 20,
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
  header: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#666",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 18,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#0055A5",
  },
  // Documents Overview Styles
  documentsStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  documentStatCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  documentStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentStatIconText: {
    fontSize: 16,
  },
  documentStatInfo: {
    flex: 1,
  },
  documentStatNumber: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 2,
  },
  documentStatLabel: {
    fontSize: 11,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  // Superior Orders Styles
  superiorOrdersList: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  superiorOrderCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  superiorOrderHeader: {
    marginBottom: 12,
  },
  superiorOrderSubject: {
    fontSize: 14,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 4,
  },
  superiorOrderSender: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
  },
  superiorOrderUsers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usersLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  usersTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userTag: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTagText: {
    fontSize: 10,
    fontFamily: "Poppins",
    color: "#495057",
  },
  moreTag: {
    backgroundColor: "#0055A5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreTagText: {
    fontSize: 10,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
  // Documents List Styles
  documentsList: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 2,
  },
  documentDetail: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 10,
    fontFamily: "Poppins",
    color: "#999",
  },
  documentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  documentTypeText: {
    fontSize: 10,
    fontFamily: "PoppinsBold",
    color: "white",
  },
  // Actions Grid
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#333",
    textAlign: "center",
  },
  // Recent Users Styles
  recentUsersList: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recentUserCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0055A5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontFamily: "PoppinsBold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 2,
  },
  userDateInline: {
    fontSize: 11,
    fontFamily: "Poppins",
    color: "#888",
    marginTop: 2,
  },
  userMeta: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 10,
    fontFamily: "PoppinsBold",
    color: "white",
  },
  userDate: {
    fontSize: 10,
    fontFamily: "Poppins",
    color: "#999",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#999",
  },
});
