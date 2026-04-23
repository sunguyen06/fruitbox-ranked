"use client";

import { io, type Socket } from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./protocol";

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

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
    transports: ["websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 5_000,
  });
}
