import { useEffect, useRef, useState, useCallback } from "react";
import {
  connectWebSocket,
  sendMessage,
  closeWebSocket,
} from "../websockets/socket";

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = connectWebSocket();

    if (!socketRef.current) return;
    socketRef.current.onopen = () => setIsConnected(true);
    socketRef.current.onclose = () => setIsConnected(false);
    socketRef.current.onmessage = (event: MessageEvent) =>
      setLastMessage(event);

    return () => {
      closeWebSocket();
      setIsConnected(false);
    };
  }, []);

  const send = useCallback((msg: string) => {
    sendMessage(msg);
  }, []);

  return { isConnected, lastMessage, send };
};
