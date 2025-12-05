import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WeekSummary {
  week: number;
  start: string;
  end: string;
  masuk: number;
  keluar: number;
}

interface SummaryData {
  year: number;
  month: number;
  month_name: string;
  weeks: WeekSummary[];
}

export default function StaffHome() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Error", "Token tidak ditemukan");
        return;
      }

      const res = await fetch(`${API_URL}/api/documents/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "Gagal mengambil ringkasan");
        return;
      }

      setSummary(data);
    } catch (error) {
      console.log("Fetch summary error:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mengambil data ringkasan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleLogout = async () => {
    try {
      const tokenId = await SecureStore.getItemAsync("token_id");
      const token = await SecureStore.getItemAsync("token");

      if (!tokenId || !token) {
        Alert.alert("Error", "Token tidak ditemukan");
        return;
      }

      const res = await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token_id: tokenId }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "Gagal logout");
        return;
      }

      // Hapus token dari SecureStore
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("token_id");

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Error", "Terjadi kesalahan saat logout");
    }
  };

  // Format tanggal dari "2025-12-02 15:04:26.538" atau "2025-12-02" menjadi "02/12"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    const datePart = dateStr.split(" ")[0];
    const [, month, day] = datePart.split("-");

    const monthNames: Record<string, string> = {
      "01": "Jan",
      "02": "Feb",
      "03": "Mar",
      "04": "Apr",
      "05": "Mei",
      "06": "Jun",
      "07": "Jul",
      "08": "Agu",
      "09": "Sep",
      "10": "Okt",
      "11": "Nov",
      "12": "Des",
    };

    const monthName = monthNames[month] || month;

    return `${day} ${monthName}`;
  };

  // Hitung total bulanan
  const getMonthlyTotal = () => {
    if (!summary?.weeks) return { masuk: 0, keluar: 0, total: 0 };

    const masuk = summary.weeks.reduce((sum, week) => sum + week.masuk, 0);
    const keluar = summary.weeks.reduce((sum, week) => sum + week.keluar, 0);

    return { masuk, keluar, total: masuk + keluar };
  };

  return (
    <View style={styles.container}>
      <Navbar />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              Ringkasan Surat {summary?.month_name} {summary?.year}
            </Text>
          </View>

          {/* Statistik Ringkasan */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Surat Masuk</Text>
              <Text style={[styles.statValue, styles.masukColor]}>
                {getMonthlyTotal().masuk}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Surat Keluar</Text>
              <Text style={[styles.statValue, styles.keluarColor]}>
                {getMonthlyTotal().keluar}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Keseluruhan</Text>
              <Text style={[styles.statValue, styles.totalColor]}>
                {getMonthlyTotal().total}
              </Text>
            </View>
          </View>

          {/* Daftar Mingguan */}
          <View style={styles.weeklySection}>
            <Text style={styles.sectionTitle}>Per Minggu</Text>

            {loading ? (
              <Text style={styles.loadingText}>Memuat data...</Text>
            ) : summary?.weeks && summary.weeks.length > 0 ? (
              <View style={styles.weeksGrid}>
                {summary.weeks.map((week) => (
                  <View key={week.week} style={styles.weekItem}>
                    <View style={styles.weekHeader}>
                      <Text style={styles.weekNumber}>Minggu {week.week}</Text>
                      <Text style={styles.weekDateRange}>
                        {formatDate(week.start)} - {formatDate(week.end)}
                      </Text>
                    </View>

                    <View style={styles.weekStats}>
                      <View style={styles.statRow}>
                        <Text style={styles.statType}>Masuk</Text>
                        <Text style={[styles.statCount, styles.masukColor]}>
                          {week.masuk}
                        </Text>
                      </View>

                      <View style={styles.statRow}>
                        <Text style={styles.statType}>Keluar</Text>
                        <Text style={[styles.statCount, styles.keluarColor]}>
                          {week.keluar}
                        </Text>
                      </View>

                      <View style={[styles.statRow, styles.totalRow]}>
                        <Text style={styles.statType}>Total</Text>
                        <Text style={[styles.statCount, styles.totalColor]}>
                          {week.masuk + week.keluar}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Tidak ada data surat untuk bulan ini
                </Text>
              </View>
            )}
          </View>

          {/* Tombol Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "PoppinsBold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#64748b",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "PoppinsBold",
  },
  masukColor: {
    color: "#10b981", // Hijau
  },
  keluarColor: {
    color: "#ef4444", // Merah
  },
  totalColor: {
    color: "#3b82f6", // Biru
  },
  weeklySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "PoppinsSemiBold",
    color: "#1e293b",
    marginBottom: 16,
  },
  weeksGrid: {
    gap: 16,
  },
  weekItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  weekNumber: {
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
    color: "#1e293b",
  },
  weekDateRange: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#64748b",
  },
  weekStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  statType: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#475569",
  },
  statCount: {
    fontSize: 18,
    fontFamily: "PoppinsSemiBold",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingText: {
    textAlign: "center",
    fontFamily: "PoppinsMedium",
    color: "#64748b",
    padding: 32,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
  },
});
