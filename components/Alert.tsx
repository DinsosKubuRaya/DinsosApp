import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AlertProps {
  title?: string;
  message: string;
  onYes: () => void;
  onNo: () => void;
}

const Alert: React.FC<AlertProps> = ({ title, message, onYes, onNo }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={onNo}
          >
            <Text style={styles.noButtonText}>Tidak</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.yesButton]}
            onPress={onYes}
          >
            <Text style={styles.yesButtonText}>Ya</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 2000, // Pastikan di atas semua komponen lainnya
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#dc3545', // Warna merah untuk konfirmasi hapus
  },
  noButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  yesButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'PoppinsMedium',
  },
  noButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'PoppinsMedium',
  },
});

export default Alert;