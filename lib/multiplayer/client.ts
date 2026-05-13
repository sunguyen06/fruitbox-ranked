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

export interface RenderWakeResponse {
  configured: boolean;
  ok: boolean;
  targetUrl: string | null;
  status: number | null;
}

const DEFAULT_WAKE_TIMEOUT_MS = 45_000;
const DEFAULT_WAKE_INTERVAL_MS = 2_500;

export async function wakeRealtimeService(): Promise<RenderWakeResponse> {
  try {
    const response = await fetch("/api/render-wake", {
      method: "POST",
      keepalive: true,
    });

    if (!response.ok) {
      return {
        configured: false,
        ok: false,
        targetUrl: null,
        status: response.status,
      };
    }

    return (await response.json()) as RenderWakeResponse;
  } catch {
    return {
      configured: false,
      ok: false,
      targetUrl: null,
      status: null,
    };
  }
}

export async function waitForRealtimeServiceToWake(options?: {
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WAKE_TIMEOUT_MS;
  const intervalMs = options?.intervalMs ?? DEFAULT_WAKE_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await wakeRealtimeService();

    if (result.ok || !result.configured) {
      return true;
    }

    await delay(intervalMs);
  }

  return false;
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
    reconnectionAttempts: 20,
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 8_000,
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

function delay(durationMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
