"use client";

import { useEffect, useState } from "react";

import {
  createRealtimeSocket,
  fetchRealtimeSessionToken,
  getSocketServerUrl,
  type RealtimeSocket,
  waitForRealtimeServiceToWake,
} from "./client";
import type { SessionReadyPayload } from "./protocol";

export interface RealtimeConnectionState {
  status: "disabled" | "waking" | "connecting" | "connected" | "disconnected";
  socket: RealtimeSocket | null;
  session: SessionReadyPayload | null;
  socketUrl: string | null;
}

export function useRealtimeConnection(isEnabled: boolean): RealtimeConnectionState {
  const socketUrl = getSocketServerUrl();
  const [state, setState] = useState<RealtimeConnectionState>(() => ({
    status: socketUrl && isEnabled ? "waking" : "disabled",
    socket: null,
    session: null,
    socketUrl,
  }));

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const socket = createRealtimeSocket();
    let isCancelled = false;

    if (!socket) {
      return;
    }

    const realtimeSocket = socket;

    const handleConnect = () => {
      setState((current) => ({
        ...current,
        status: "connected",
        socket: realtimeSocket,
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
        status: "connecting",
        socket: null,
      }));
    };

    const handleSessionReady = (session: SessionReadyPayload) => {
      setState((current) => ({
        ...current,
        session,
        socket: realtimeSocket,
      }));
    };

    realtimeSocket.on("connect", handleConnect);
    realtimeSocket.on("disconnect", handleDisconnect);
    realtimeSocket.on("connect_error", handleConnectError);
    realtimeSocket.on("session:ready", handleSessionReady);
    void connectSocket();

    return () => {
      isCancelled = true;
      realtimeSocket.off("connect", handleConnect);
      realtimeSocket.off("disconnect", handleDisconnect);
      realtimeSocket.off("connect_error", handleConnectError);
      realtimeSocket.off("session:ready", handleSessionReady);
      realtimeSocket.disconnect();
    };

    async function connectSocket() {
      setState((current) => ({
        ...current,
        status: "waking",
        socket: null,
      }));

      const didWake = await waitForRealtimeServiceToWake();

      if (isCancelled) {
        return;
      }

      if (!didWake) {
        setState((current) => ({
          ...current,
          status: "disconnected",
          socket: null,
          session: null,
        }));
        return;
      }

      const sessionToken = await fetchRealtimeSessionToken().catch(() => null);

      if (isCancelled) {
        return;
      }

      setState((current) => ({
        ...current,
        status: "connecting",
        socket: null,
      }));

      if (!sessionToken) {
        setState((current) => ({
          ...current,
          status: "disconnected",
          socket: null,
          session: null,
        }));
        return;
      }

      realtimeSocket.auth = {
        sessionToken,
      };
      realtimeSocket.connect();
    }
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
