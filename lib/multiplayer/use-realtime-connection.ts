"use client";

import { useEffect, useState } from "react";

import { createRealtimeSocket, getSocketServerUrl, type RealtimeSocket } from "./client";
import type { SessionReadyPayload } from "./protocol";

export interface RealtimeConnectionState {
  status: "disabled" | "connecting" | "connected" | "disconnected";
  socket: RealtimeSocket | null;
  session: SessionReadyPayload | null;
  socketUrl: string | null;
}

export function useRealtimeConnection(isEnabled: boolean): RealtimeConnectionState {
  const socketUrl = getSocketServerUrl();
  const [state, setState] = useState<RealtimeConnectionState>(() => ({
    status: socketUrl && isEnabled ? "connecting" : "disabled",
    socket: null,
    session: null,
    socketUrl,
  }));

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const socket = createRealtimeSocket();

    if (!socket) {
      return;
    }

    const handleConnect = () => {
      setState((current) => ({
        ...current,
        status: "connected",
        socket,
      }));
    };

    const handleDisconnect = () => {
      setState((current) => ({
        ...current,
        status: "disconnected",
        socket: null,
      }));
    };

    const handleConnectError = () => {
      setState((current) => ({
        ...current,
        status: "disconnected",
        socket: null,
      }));
    };

    const handleSessionReady = (session: SessionReadyPayload) => {
      setState((current) => ({
        ...current,
        session,
        socket,
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("session:ready", handleSessionReady);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("session:ready", handleSessionReady);
      socket.disconnect();
    };
  }, [isEnabled, socketUrl]);

  if (!isEnabled) {
    return {
      status: "disabled",
      socket: null,
      session: null,
      socketUrl,
    };
  }

  return state;
}
