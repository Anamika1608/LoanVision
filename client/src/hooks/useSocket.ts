import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(sessionId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io("/", {
      query: { sessionId },
      withCredentials: true
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-session", sessionId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("leave-session", sessionId);
      socket.disconnect();
    };
  }, [sessionId]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, isConnected, emit, on };
}
