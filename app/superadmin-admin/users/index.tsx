import React, { useEffect, useState } from "react";
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
import Log from "@/components/Log";
import Navbar from "@/components/Navbar";
import UserForm from "@/components/UserForm";
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
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // State untuk Alert konfirmasi hapus
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
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Gagal mengambil data users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data.slice(0, 10)); // Batasi ke 10 data pertama
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal memuat data users",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await SecureStore.getItemAsync("role");
      setUserRole(role);
    };
    fetchUserRole();
    fetchUsers();
  }, []);

  // Filter users berdasarkan pencarian
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users.slice(0, 10));
    } else {
      const filtered = users
        .filter((user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10); // Tetap batasi maksimal 10 hasil
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCreateUser = async (userData: {
    name: string;
    username: string;
    password: string;
    role: string;
  }) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const endpoint = `${API_URL}/api/users/${userData.role}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = "Gagal membuat user";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setShowForm(false);
      setLogMessage({
        type: "success",
        message: "User berhasil dibuat",
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Create user error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal membuat user",
      });
    }
  };

  const handleUpdateUser = async (userData: {
    name: string;
    username: string;
    password: string;
    role: string;
  }) => {
    if (!editingUser) return;

    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = "Gagal mengupdate user";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setShowForm(false);
      setEditingUser(null);
      setLogMessage({
        type: "success",
        message: "User berhasil diupdate",
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Update user error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal mengupdate user",
      });
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
    }
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      console.error("Delete user error:", error);
      setLogMessage({
        type: "error",
        message: error.message || "Gagal menghapus user",
      });
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
          <Text style={styles.title}>Manajemen Users</Text>
          <Text style={styles.subtitle}>Kelola user admin dan staff</Text>
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
            <Text style={styles.statLabel}>Staff</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari berdasarkan nama..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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

        <View style={styles.actionBar}>
          {userRole === "superadmin" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}
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
                  ? `Tidak ditemukan user dengan nama "${searchQuery}"`
                  : "Belum ada data user"}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userMain}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userUsername}>{user.username}</Text>
                    <Text style={styles.userDate}>
                      Dibuat: {formatDate(user.created_at)}
                    </Text>
                  </View>
                  <View style={styles.userMeta}>
                    {/* Role di kiri */}
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

                    {/* Actions di kanan */}
                    <View style={{ flex: 1 }} />

                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setEditingUser(user);
                          setShowForm(true);
                        }}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>

                      {userRole === "superadmin" &&
                        user.role !== "superadmin" && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteUser(user)}
                          >
                            <Text style={styles.deleteButtonText}>Hapus</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <UserForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        editData={editingUser}
      />

      {/* Alert Konfirmasi Hapus */}
      {showDeleteAlert && userToDelete && (
        <Alert
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus user ${userToDelete.name}?`}
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
  // Search Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins",
  },
  clearSearchButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  clearSearchText: {
    fontSize: 16,
    color: "#666",
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
    textAlign: "center",
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
    paddingBottom: 25,
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#0055A5",
  },
  userInfo: {
    flex: 1,
  },
  userMain: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#666",
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 10,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontFamily: "PoppinsBold",
    color: "white",
  },
  userDate: {
    fontSize: 11,
    fontFamily: "Poppins",
    color: "#999",
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
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
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#666",
    textAlign: "center",
  },
});
