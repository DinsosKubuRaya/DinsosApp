// useWebSocket.tsx
import { API_URL } from "@/config/apiConfig";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type WebSocketContextType = {
  unreadCount: number;
  setUnreadCount: (v: number) => void;
  profileData: { name: string; photoUrl: string };
  updateProfileData: (name: string, photoUrl: string) => void;
  isWebSocketConnected: boolean;
  retryCount: number;
  userChangeTrigger: number;
};

const WebSocketContext = createContext<WebSocketContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  profileData: { name: "", photoUrl: "" },
  updateProfileData: () => {},
  isWebSocketConnected: false,
  retryCount: 0,
  userChangeTrigger: 0,
});

export const WebSocketProvider = ({ children }: any) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileData, setProfileData] = useState({ name: "", photoUrl: "" });
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [userChangeTrigger, setUserChangeTrigger] = useState(0);

  useEffect(() => {
    const loadInitialProfile = async () => {
      const storedName = await SecureStore.getItemAsync("name");
      const storedPhoto = await SecureStore.getItemAsync("photo_url");
      setProfileData({
        name: storedName || "",
        photoUrl: storedPhoto || "",
      });
    };
    loadInitialProfile();
  }, []);

  const updateProfileData = (name: string, photoUrl: string) => {
    setProfileData({ name, photoUrl });
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let connectionAttempts = 0;
    const MAX_RETRY_DELAY = 30000;
    const BASE_DELAY = 1000;

    const setupWS = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        const userId = await SecureStore.getItemAsync("user_id");

        if (!token || !userId) {
          console.log(
            "WebSocket: Token atau user_id belum tersedia, akan coba lagi..."
          );

          connectionAttempts++;
          const delay = Math.min(
            BASE_DELAY * Math.pow(1.5, connectionAttempts),
            MAX_RETRY_DELAY
          );
          reconnectTimeout = setTimeout(setupWS, delay);
          return;
        }

        const wsUrl =
          API_URL.replace("http://", "ws://").replace("https://", "wss://") +
          `/api/ws/all?user_id=${userId}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("✅ WS Connected (GLOBAL)");
          setIsWebSocketConnected(true);
          setRetryCount((prev) => prev + 1);
          connectionAttempts = 0;
        };

        ws.onmessage = (event) => {
          console.log("WS RAW MESSAGE:", event.data);
          try {
            const data = JSON.parse(event.data);

            if (data.type === "notification_added") {
              setUnreadCount((prev) => prev + 1);
            }

            if (data.type === "profile_updated") {
              if (data.photo_url) {
                SecureStore.setItemAsync("photo_url", data.photo_url);
                setProfileData((prev) => ({
                  ...prev,
                  photoUrl: data.photo_url,
                }));
              }
              if (data.name) {
                SecureStore.setItemAsync("name", data.name);
                setProfileData((prev) => ({ ...prev, name: data.name }));
              }
            }

            if (
              data.type === "user_created" ||
              data.type === "user_updated" ||
              data.type === "user_deleted"
            ) {
              console.log("Realtime User Event:", data);

              setUserChangeTrigger(Date.now());
            }
          } catch (error) {
            console.error("WebSocket message parsing error:", error);
          }
        };

        ws.onerror = (err) => {
          console.log("🔴 WebSocket error:", err);
          setIsWebSocketConnected(false);
        };

        ws.onclose = () => {
          console.log("WebSocket closed → reconnecting...");
          setIsWebSocketConnected(false);

          connectionAttempts++;
          const delay = Math.min(
            BASE_DELAY * Math.pow(1.5, connectionAttempts),
            MAX_RETRY_DELAY
          );

          console.log(
            `Reconnecting in ${delay}ms... (attempt ${connectionAttempts})`
          );
          reconnectTimeout = setTimeout(setupWS, delay);
        };
      } catch (error) {
        console.error("WebSocket setup error:", error);

        connectionAttempts++;
        const delay = Math.min(
          BASE_DELAY * Math.pow(1.5, connectionAttempts),
          MAX_RETRY_DELAY
        );
        reconnectTimeout = setTimeout(setupWS, delay);
      }
    };

    setupWS();

    // Cleanup function
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; 
        ws.close();
      }
    };
  }, []); 

  return (
    <WebSocketContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        profileData,
        updateProfileData,
        isWebSocketConnected,
        retryCount,
        userChangeTrigger,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketData = () => useContext(WebSocketContext);
