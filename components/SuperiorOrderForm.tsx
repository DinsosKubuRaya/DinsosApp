import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface User {
  id: string;
  name: string;
  role: string;
}

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  sender: string;
  subject: string;
}

interface SuperiorOrderFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { document_id: string; user_ids: string[] }) => void;
  editData: any;
  documents: Document[];
  users: User[];
}

export default function SuperiorOrderForm({
  visible,
  onClose,
  onSubmit,
  editData,
  documents,
  users,
}: SuperiorOrderFormProps) {
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [documentSearch, setDocumentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (editData) {
      setSelectedDocument(editData.document_id);
      // Gunakan user_ids dari editData jika ada, bukan reset ke array kosong
      setSelectedUsers(editData.user_ids || []);
    } else {
      setSelectedDocument("");
      setSelectedUsers([]);
    }
    setDocumentSearch("");
    setUserSearch("");
    setShowDocumentDropdown(false);
    setShowUserDropdown(false);
  }, [editData, visible]);

  const decodeFileName = (fileName: string) => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(documentSearch.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Batasi hanya 4 item untuk dokumen
  const limitedDocuments = filteredDocuments.slice(0, 4);

  // Batasi hanya 4 item untuk pengguna
  const limitedUsers = filteredUsers.slice(0, 4);

  const handleSubmit = () => {
    if (!selectedDocument || selectedUsers.length === 0) {
      alert("Harap pilih dokumen dan setidaknya satu pengguna");
      return;
    }

    onSubmit({
      document_id: selectedDocument,
      user_ids: selectedUsers,
    });
  };

  const toggleUserSelection = (userId: string | number) => {
    const idStr = String(userId);
    setSelectedUsers((prev) =>
      prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr]
    );
  };

  const getSelectedDocument = () => {
    return documents.find((doc) => doc.id === selectedDocument);
  };

  const renderDocumentItems = () => {
    if (limitedDocuments.length === 0) {
      return (
        <View style={styles.dropdownItem}>
          <Text style={styles.noResultsText}>Tidak ada dokumen ditemukan</Text>
        </View>
      );
    }

    return limitedDocuments.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.dropdownItem}
        onPress={() => {
          setSelectedDocument(item.id);
          setShowDocumentDropdown(false);
          setDocumentSearch("");
        }}
      >
        <Text style={styles.dropdownItemText}>
          {decodeFileName(item.file_name)}
        </Text>
      </TouchableOpacity>
    ));
  };

  const renderUserItems = () => {
    if (limitedUsers.length === 0) {
      return (
        <View style={styles.dropdownItem}>
          <Text style={styles.noResultsText}>Tidak ada pengguna ditemukan</Text>
        </View>
      );
    }

    return limitedUsers.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.dropdownItem,
          selectedUsers.includes(String(item.id)) && styles.selectedItem,
        ]}
        onPress={() => toggleUserSelection(item.id)}
      >
        <View style={styles.userItem}>
          <View style={styles.userInfo}>
            <Text style={styles.dropdownItemText}>{item.name}</Text>
          </View>
          {selectedUsers.includes(String(item.id)) && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editData ? "Edit Penugasan" : "Tambah Penugasan Baru"}
              </Text>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* Document Selection */}
              <View style={[styles.formGroup, { zIndex: 20 }]}>
                <Text style={styles.label}>Pilih Dokumen *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => {
                      setShowDocumentDropdown(!showDocumentDropdown);
                      setShowUserDropdown(false);
                    }}
                  >
                    <Text
                      style={
                        selectedDocument
                          ? styles.dropdownText
                          : styles.placeholderText
                      }
                    >
                      {selectedDocument
                        ? decodeFileName(
                            getSelectedDocument()?.file_name || "Memuat..."
                          )
                        : "Cari dan pilih dokumen..."}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  {showDocumentDropdown && (
                    <View style={styles.dropdownMenu}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Cari dokumen..."
                        value={documentSearch}
                        onChangeText={setDocumentSearch}
                      />
                      <View style={styles.dropdownList}>
                        {renderDocumentItems()}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Users Selection */}
              <View style={[styles.formGroup, { zIndex: 10 }]}>
                <Text style={styles.label}>Pilih Pengguna *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => {
                      setShowUserDropdown(!showUserDropdown);
                      setShowDocumentDropdown(false);
                    }}
                  >
                    <Text
                      style={
                        selectedUsers.length > 0
                          ? styles.dropdownText
                          : styles.placeholderText
                      }
                    >
                      {selectedUsers.length > 0
                        ? `${selectedUsers.length} pengguna terpilih`
                        : "Cari dan pilih pengguna..."}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  {showUserDropdown && (
                    <View style={styles.dropdownMenu}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Cari pengguna..."
                        value={userSearch}
                        onChangeText={setUserSearch}
                      />
                      <View style={styles.dropdownList}>
                        {renderUserItems()}
                      </View>
                    </View>
                  )}
                </View>

                {/* Selected Users Tags */}
                {selectedUsers.length > 0 && (
                  <View style={styles.selectedUsersContainer}>
                    <Text style={styles.selectedUsersLabel}>
                      Pengguna terpilih:
                    </Text>
                    <View style={styles.selectedUsersList}>
                      {selectedUsers.map((userId) => {
                        const user = users.find(
                          (u) => String(u.id) === String(userId)
                        );
                        return user ? (
                          <View key={userId} style={styles.userTag}>
                            <Text style={styles.userTagText}>{user.name}</Text>
                            <TouchableOpacity
                              onPress={() => toggleUserSelection(userId)}
                              style={styles.removeTag}
                            >
                              <Text style={styles.removeTagText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null;
                      })}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editData ? "Update" : "Simpan"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 5,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    minHeight: "90%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "PoppinsBold",
    color: "#333",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#333",
    marginBottom: 8,
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 9999,
    elevation: 10,
    overflow: "visible",
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#6c757d",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#6c757d",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 260,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10000,
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Poppins",
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  selectedItem: {
    backgroundColor: "#e3f2fd",
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#333",
  },
  dropdownItemSubtext: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#666",
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#6c757d",
    textAlign: "center",
    fontStyle: "italic",
  },
  checkmark: {
    fontSize: 16,
    color: "#0055A5",
    fontWeight: "bold",
  },
  selectedUsersContainer: {
    marginTop: 12,
  },
  selectedUsersLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#666",
    marginBottom: 8,
  },
  selectedUsersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  userTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  userTagText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#0055A5",
  },
  removeTag: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0055A5",
    justifyContent: "center",
    alignItems: "center",
  },
  removeTagText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  editInfo: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    marginTop: 16,
  },
  editInfoText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#856404",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6c757d",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#6c757d",
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#0055A5",
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "white",
  },
});
