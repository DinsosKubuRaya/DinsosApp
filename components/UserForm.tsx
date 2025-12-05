import React, { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface UserFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    username: string;
    password: string;
    role: string;
  }) => void;
  editData?: any;
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  onClose,
  onSubmit,
  editData,
}) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");

  useEffect(() => {
    if (editData) {
      // Saat edit user → password tidak boleh muncul
      setName(editData.name || "");
      setUsername(editData.username || "");
      setSelectedRole(editData.role || "staff");
      setPassword("");
    } else {
      // Reset form → tambah user baru
      setName("");
      setUsername("");
      setPassword("");
      setSelectedRole("staff");
    }
  }, [editData, visible]);

  const handleSubmit = () => {
    // Validasi
    if (!name || !username || (!editData && !password)) {
      return;
    }

    if (editData) {
      // Saat edit user → kirim data tanpa password jika kosong
      const submitData = {
        name,
        username,
        role: selectedRole,
      };

      // Hanya kirim password jika diisi (untuk update password)
      if (password) {
        onSubmit({
          ...submitData,
          password,
        });
      } else {
        onSubmit({
          ...submitData,
          password: "", // atau hapus field ini
        });
      }
    } else {
      // Tambah user baru → password wajib
      onSubmit({
        name,
        username,
        password,
        role: selectedRole,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editData ? "Edit User" : "Tambah User Baru"}
          </Text>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            {/* Password hanya muncul jika tambah user */}
            {!editData && (
              <>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </>
            )}

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "staff" && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole("staff")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "staff" && styles.roleButtonTextActive,
                  ]}
                >
                  Staff
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "admin" && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole("admin")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "admin" && styles.roleButtonTextActive,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#555",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: "#333",
    fontFamily: "Poppins",
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e9ecef",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  roleButtonActive: {
    borderColor: "#0055A5",
    backgroundColor: "#e3f2fd",
  },
  roleButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#666",
  },
  roleButtonTextActive: {
    color: "#0055A5",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dc3545",
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelButtonText: {
    color: "#dc3545",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#0055A5",
  },
  submitButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
});

export default UserForm;
