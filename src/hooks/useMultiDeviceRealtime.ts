import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ENDPOINTS } from "../api/endpoints";

// Type for WebSocket data (allow any value for each topic for flexibility)
export interface DeviceRealtimeData {
  [topic: string]: any;
}

/**
 * useMultiDeviceRealtime
 * Connects to multiple device topics via WebSocket and provides latest parameter data.
 * @param topics Array of topic strings (e.g., ["Gateway1/1", "Gateway2/2"])
 * @returns DeviceRealtimeData, connection status, and connected devices
 */
export function useMultiDeviceRealtime(topics: string[]) {
  const [data, setData] = useState<DeviceRealtimeData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketsRef = useRef<{ [topic: string]: Socket }>({});

  useEffect(() => {
    // Cleanup previous sockets (robust, suppress errors)
    Object.values(socketsRef.current).forEach((socket) => {
      try {
        // Only disconnect if socket is connected
        if (socket.connected) {
          socket.disconnect();
        }
      } catch (e) {
        // Suppress all disconnect/close errors
      }
    });
    socketsRef.current = {};
    setData({});

    // Add a short delay before reconnecting
    const delay = 500; // ms
    setIsConnecting(true);
    const timeout = setTimeout(() => {
      let activeConnections = 0;
      let connectingCount = 0;
      topics.forEach((topic) => {
        if (!topic) return;
        // Always create a new socket for each topic (like RealTime page)
        const socket = io(ENDPOINTS.REALTIME_WS, {
          transports: ["websocket"], 
        });
        socketsRef.current[topic] = socket;

        connectingCount++;

        socket.on("connect", () => {
          activeConnections++;
          connectingCount--;
          if (connectingCount <= 0) setIsConnecting(false);
          if (activeConnections === topics.length) setIsConnected(true);
        });
        socket.on("disconnect", () => {
          activeConnections--;
          if (activeConnections <= 0) setIsConnected(false);
        });
        socket.on("connect_error", () => {
          connectingCount--;
          if (connectingCount <= 0) setIsConnecting(false);
        });

        // Listen for all events for debugging, but only log topic-like events
        // socket.onAny((event, ...args) => {
        //   if (event === topic) {
        //     console.log(`[LCDCard][WS][onAny] Event:`, event, ...args);
        //   }
        // });

        socket.on(topic, (msg: unknown) => {
          // Always set data for the topic, regardless of structure
          setData((prev) => {
            const newData = { ...prev, [topic]: msg };
            return newData;
          });
        });
      });
    }, delay);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      Object.values(socketsRef.current).forEach((socket) => {
        try {
          if (socket.connected) {
            socket.disconnect();
          }
        } catch (e) {
          // Suppress all disconnect/close errors
        }
      });
      socketsRef.current = {};
      setData({});
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [topics]);

  return { data, isConnected, isConnecting };
}
