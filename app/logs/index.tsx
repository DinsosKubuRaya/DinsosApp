import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "@/config/apiConfig";

interface ActivityLog {
  id: number;
  user_id: string;
  user_name: string;
  action: string;
  message: string;
  created_at: string;
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchActivityLogs = useCallback(
    async (reset = false, customPage?: number) => {
      try {
        setError(null);

        const token = await SecureStore.getItemAsync("token");
        if (!token) return;

        const currentPage = reset ? 1 : customPage || page;

        const response = await fetch(
          `${API_URL}/api/activity-logs?page=${currentPage}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (reset) {
          setLogs(data.data || []);
          setPage(1);
        } else {
          setLogs((prev) => [...prev, ...(data.data || [])]);
        }

        setTotalLogs(data.total);

        // **Jika data kurang dari 20 → stop infinite scroll**
        setHasMore((data.data || []).length === 20);
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

  const decodeFileName = (fileName: string) => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (active) {
        fetchActivityLogs(true);
      }

      return () => {
        active = false;
      };
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivityLogs(true);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    setPage((prev) => {
      const nextPage = prev + 1;
      fetchActivityLogs(false, nextPage); // Kirim page manual
      return nextPage;
    });
  };

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    fetchActivityLogs(true);
  };

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case "create":
      case "created":
        return "#10b981";
      case "update":
      case "updated":
        return "#3b82f6";
      case "delete":
      case "deleted":
        return "#ef4444";
      case "login":
        return "#8b5cf6";
      case "download":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case "create":
      case "created":
        return "add-circle";
      case "update":
      case "updated":
        return "refresh-circle";
      case "delete":
      case "deleted":
        return "trash";
      case "login":
        return "log-in";
      case "download":
        return "download";
      default:
        return "ellipse";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes}m yang lalu`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h yang lalu`;
      } else if (diffInDays < 7) {
        return `${Math.floor(diffInDays)}d yang lalu`;
      } else {
        return date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      return "Tanggal tidak valid";
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderLogItem = ({ item }: { item: ActivityLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.user_name || "Unknown User"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.actionBadge,
            { backgroundColor: getActionColor(item.action) },
          ]}
        >
          <Ionicons
            name={getActionIcon(item.action) as any}
            size={12}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {item.action?.toUpperCase() || "ACTION"}
          </Text>
        </View>
      </View>

      <Text style={styles.logMessage}>{decodeFileName(item.message)}</Text>

      <View style={styles.logFooter}>
        <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
        <View style={styles.logId}>
          <Text style={styles.logIdText}>ID: {item.id}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text style={styles.loadingText}>Memuat log aktivitas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSide}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={22} color="#0066ff" />
                <Text style={styles.backButtonLabel}>Kembali</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Log Aktivitas</Text>
            </View>

            <View style={styles.headerSide} />
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
              <View style={styles.errorContent}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  onPress={retryFetch}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stats Summary - hanya tampil jika tidak error dan ada data */}
          {!error && logs.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalLogs}</Text>
                <Text style={styles.statLabel}>Total Aktivitas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {
                    logs.filter((log) =>
                      log.action?.toLowerCase().includes("create")
                    ).length
                  }
                </Text>
                <Text style={styles.statLabel}>Dibuat</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {
                    logs.filter((log) =>
                      log.action?.toLowerCase().includes("update")
                    ).length
                  }
                </Text>
                <Text style={styles.statLabel}>Diupdate</Text>
              </View>
            </View>
          )}

          {/* Logs List */}
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderLogItem}
            style={styles.logsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0066ff"]}
                tintColor="#0066ff"
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              error ? null : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="time-outline" size={64} color="#cbd5e1" />
                  <Text style={styles.emptyText}>Tidak ada log aktivitas</Text>
                  <Text style={styles.emptySubtext}>
                    Aktivitas sistem akan muncul di sini
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#0066ff" />
                  <Text style={styles.loadingMoreText}>
                    Memuat lebih banyak...
                  </Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontFamily: "Poppins",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerSide: {
    width: 80,
    marginTop: 42,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginTop: 42,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PoppinsBold",
    color: "#1e293b",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonLabel: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#0066ff",
    marginLeft: 2,
  },
  // Error Styles
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorContent: {
    flex: 1,
    marginLeft: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#dc2626",
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#64748b",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 8,
  },
  logsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#0066ff",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: "PoppinsSemiBold",
    color: "#1e293b",
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#64748b",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 10,
    fontFamily: "PoppinsBold",
    color: "#fff",
    marginLeft: 4,
  },
  logMessage: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#475569",
    lineHeight: 20,
    marginBottom: 12,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#94a3b8",
  },
  logId: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logIdText: {
    fontSize: 10,
    fontFamily: "PoppinsMedium",
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
    color: "#64748b",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#94a3b8",
    textAlign: "center",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingMoreText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#64748b",
    marginLeft: 8,
  },
});
