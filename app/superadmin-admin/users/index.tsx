import { useFocusEffect, useRouter } from "expo-router";
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
import Log from "@/components/Log";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/config/apiConfig";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data.slice(0, 10));
    } catch (error: any) {
      setLogMessage({
        type: "error",
        message: error.message || "Gagal memuat data users",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("DocumentPage: screen focused -> calling fetchUsers()");
      setLoading(true);
      fetchUsers();
      return () => {
        console.log("DocumentPage: screen unfocused");
      };
    }, [])
  );

  useEffect(() => {
    const fetchUserInfo = async () => {
      const role = await SecureStore.getItemAsync("role");
      const userId = await SecureStore.getItemAsync("user_id");
      setUserRole(role);
      setCurrentUserId(userId);
    };

    fetchUserInfo();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users.slice(0, 10));
    } else {
      const filtered = users
        .filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10);
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleAddUser = () => {
    router.push("/form/UserForm");
  };

  const handleEditUser = (user: User) => {
    router.push({
      pathname: "/form/UserForm",
      params: { editData: JSON.stringify(user) },
    });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) await deleteUser(userToDelete.id);
    setShowDeleteAlert(false);
    setUserToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteAlert(false);
    setUserToDelete(null);
  };

  const deleteUser = async (userId: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorMessage = "Gagal menghapus user";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setLogMessage({
        type: "success",
        message: "User berhasil dihapus",
      });

      fetchUsers();
    } catch (error: any) {
      setLogMessage({
        type: "error",
        message: error.message || "Gagal menghapus user",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "#FF6B35";
      case "admin":
        return "#0055A5";
      case "staff":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "staff":
        return "User";
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const canEditUser = (user: User) => {
    if (!userRole) return false;
    if (userRole === "superadmin") return user.id !== currentUserId;
    if (userRole === "admin") return user.role === "staff";
    return false;
  };

  const canDeleteUser = (user: User) => {
    if (!userRole) return false;
    if (userRole === "superadmin")
      return user.id !== currentUserId && user.role !== "superadmin";
    if (userRole === "admin") return user.role === "staff";
    return false;
  };

  const canCreateUser = () => {
    return userRole === "superadmin" || userRole === "admin";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={styles.loadingText}>Memuat data users...</Text>
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Manajemen Users</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {users.filter((u) => u.role === "admin").length}
              </Text>
              <Text style={styles.statLabel}>Admin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {users.filter((u) => u.role === "staff").length}
              </Text>
              <Text style={styles.statLabel}>User</Text>
            </View>
            {userRole === "superadmin" && (
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {users.filter((u) => u.role === "superadmin").length}
                </Text>
                <Text style={styles.statLabel}>Super Admin</Text>
              </View>
            )}
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari pengguna..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery !== "" && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.actionBar}>
            {canCreateUser() && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddUser}
              >
                <Text style={styles.addButtonText}>+ Tambah User</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.usersList}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery !== ""
                    ? `Tidak ditemukan user dengan kata kunci "${searchQuery}"`
                    : "Belum ada data user"}
                </Text>
              </View>
            ) : (
              filteredUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: getRoleColor(user.role) },
                        ]}
                      >
                        <Text style={styles.roleText}>
                          {getRoleDisplayName(user.role)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Username:</Text>
                        <Text style={styles.detailValue}>{user.username}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Dibuat:</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(user.created_at)}
                        </Text>
                      </View>
                      {user.id === currentUserId && (
                        <View style={styles.currentUserIndicator}>
                          <Text style={styles.currentUserText}>Akun Anda</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.userActions}>
                    {canEditUser(user) ? (
                      <>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditUser(user)}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>

                        {canDeleteUser(user) && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteUser(user)}
                          >
                            <Text style={styles.deleteButtonText}>Hapus</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <Text style={styles.noPermissionText}>
                        {user.id === currentUserId
                          ? "Akun sendiri"
                          : "Tidak dapat diubah"}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDeleteAlert && userToDelete && (
        <Alert
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus user "${userToDelete.name}"?`}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  // Search Styles
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
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 16,
    color: "#666",
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
  usersList: {
    flex: 1,
  },
  userCard: {
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
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  roleText: {
    fontSize: 10,
    fontFamily: "PoppinsBold",
    color: "white",
  },
  userDetails: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#333",
    flex: 1,
  },
  currentUserIndicator: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#FFF3CD",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  currentUserText: {
    fontSize: 10,
    fontFamily: "PoppinsMedium",
    color: "#856404",
  },
  userActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffc107",
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#333",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#dc3545",
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
  noPermissionText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 8,
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
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#666",
    textAlign: "center",
  },
});
