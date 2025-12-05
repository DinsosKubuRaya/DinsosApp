import React from "react";
import {
    ActivityIndicator,
    Image,
    Linking // Tambahkan import Linking
    ,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { WebView } from "react-native-webview";

interface DocumentPreviewProps {
  visible: boolean;
  onClose: () => void;
  document: {
    file_url: string;
    file_name: string;
    file_type?: string;
  } | null;
}

export default function DocumentPreview({
  visible,
  onClose,
  document,
}: DocumentPreviewProps) {
  // Fungsi untuk decode nama file
  const decodeFileName = (fileName: string) => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  // Fungsi untuk handle download
  const handleDownload = async () => {
    if (!document) return;
    
    try {
      const supported = await Linking.canOpenURL(document.file_url);
      
      if (supported) {
        await Linking.openURL(document.file_url);
      } else {
        console.log("Tidak dapat membuka URL:", document.file_url);
        // Fallback: Tampilkan alert atau pesan error
        alert("Tidak dapat membuka file. Pastikan URL valid.");
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      alert("Terjadi error saat membuka file.");
    }
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "")) {
      return "image";
    } else if (ext === "pdf") {
      return "pdf";
    } else if (["txt", "doc", "docx"].includes(ext || "")) {
      return "text";
    }
    return "other";
  };

  const renderContent = () => {
    if (!document) return null;

    const fileType = getFileType(document.file_name);

    switch (fileType) {
      case "image":
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: document.file_url }}
              style={styles.image}
              resizeMode="contain"
              onError={() => console.log("Error loading image")}
            />
          </View>
        );

      case "pdf":
        return (
          <View style={styles.webviewContainer}>
            <WebView
              source={{
                uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                  document.file_url
                )}`,
              }}
              style={styles.webview}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0055A5" />
                  <Text style={styles.loadingText}>Memuat PDF...</Text>
                </View>
              )}
            />
          </View>
        );

      case "text":
        return (
          <View style={styles.textContainer}>
            <ScrollView>
              <Text style={styles.textContent}>
                File teks: {decodeFileName(document.file_name)}
                {"\n\n"}
              </Text>
            </ScrollView>
          </View>
        );

      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Format file tidak didukung: {decodeFileName(document.file_name)}
              {"\n\n"}
              Silakan download file untuk melihat konten.
            </Text>
          </View>
        );
    }
  };

  if (!document) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {decodeFileName(document.file_name)}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>{renderContent()}</View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload} // Ganti dengan fungsi handleDownload
            >
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "95%",
    height: "95%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#333",
    flex: 1,
    marginRight: 12,
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
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    padding: 20,
  },
  textContent: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#333",
    lineHeight: 24,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  unsupportedText: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#666",
  },
  downloadButton: {
    backgroundColor: "#0055A5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "PoppinsMedium",
  },
});