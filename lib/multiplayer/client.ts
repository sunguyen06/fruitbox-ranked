"use client";

import { io, type Socket } from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./protocol";

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export interface RealtimeSocketAuthPayload {
  sessionToken?: string;
}

export function getSocketServerUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  return value ? value : null;
}

export function createRealtimeSocket(): RealtimeSocket | null {
  const url = getSocketServerUrl();

  if (!url) {
    return null;
  }

  return io(url, {
    autoConnect: false,
    auth: {} satisfies RealtimeSocketAuthPayload,
    transports: ["websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 5_000,
  });
}

export async function fetchRealtimeSessionToken(): Promise<string | null> {
  const response = await fetch("/api/realtime-auth", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    sessionToken?: string | null;
  };

  return payload.sessionToken ?? null;
}
