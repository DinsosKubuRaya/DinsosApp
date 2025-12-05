// components/Log.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface LogProps {
  type: 'success' | 'error';
  message: string;
  onHide?: () => void;
}

const Log: React.FC<LogProps> = ({ type, message, onHide }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);

  // Update ref ketika onHide berubah
  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    // Animasi masuk
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animasi keluar setelah 4 detik
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHideRef.current?.();
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [slideAnim, opacityAnim]);

  return (
    <Animated.View 
      style={[
        styles.container,
        type === 'success' ? styles.successContainer : styles.errorContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <Text style={[
        styles.text,
        type === 'success' ? styles.successText : styles.errorText
      ]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  text: {
    fontSize: 14,
    fontFamily: 'Poppins', // Konsisten dengan style lainnya
    textAlign: 'center',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
});

export default Log;