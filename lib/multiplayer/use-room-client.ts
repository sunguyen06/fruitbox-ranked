"use client";

import { useEffect, useState } from "react";

import type { NormalizedSelectionBox } from "../game";
import { useRealtimeConnection } from "./use-realtime-connection";
import type {
  MatchmakingQueueSnapshot,
  QueueCommandResponse,
  QueueKind,
  RealtimeError,
  RoomCommandResponse,
  RoomSnapshot,
} from "./protocol";

export interface RoomClientState {
  connectionStatus: "disabled" | "connecting" | "connected" | "disconnected";
  userId: string | null;
  currentRoom: RoomSnapshot | null;
  currentQueue: MatchmakingQueueSnapshot | null;
  lastError: RealtimeError | null;
  statusMessage: string | null;
  serverTimeOffsetMs: number;
  isReady: boolean;
  isHost: boolean;
  canStartCurrentRoom: boolean;
  createPrivateRoom: () => Promise<void>;
  joinPrivateRoom: (roomCode: string) => Promise<void>;
  joinMatchmakingQueue: (kind: QueueKind) => Promise<void>;
  leaveCurrentQueue: () => Promise<void>;
  leaveCurrentRoom: () => Promise<void>;
  startCurrentRoom: () => Promise<void>;
  restartCurrentRoom: () => Promise<void>;
  submitSelectionBox: (selectionBox: NormalizedSelectionBox) => Promise<boolean>;
  clearStatus: () => void;
}

export function useRoomClient(
  isAuthenticated: boolean,
  fallbackSeed?: string,
): RoomClientState {
  const connection = useRealtimeConnection(isAuthenticated);
  const [currentRoom, setCurrentRoom] = useState<RoomSnapshot | null>(null);
  const [currentQueue, setCurrentQueue] = useState<MatchmakingQueueSnapshot | null>(null);
  const [lastError, setLastError] = useState<RealtimeError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);

  useEffect(() => {
    const socket = connection.socket;

    if (!socket) {
      return;
    }

    const handleRoomUpdated = (room: RoomSnapshot) => {
      setCurrentRoom(room);
      setCurrentQueue(null);
      setLastError(null);
      setStatusMessage(null);
      setServerTimeOffsetMs(Date.parse(room.serverNow) - Date.now());
    };

    const handleQueueUpdated = (queue: MatchmakingQueueSnapshot | null) => {
      setCurrentQueue(queue);
      setLastError(null);
    };

    const handleRoomError = (error: RealtimeError) => {
      setLastError(error);
      setStatusMessage(error.message);
    };

    socket.on("room:updated", handleRoomUpdated);
    socket.on("queue:updated", handleQueueUpdated);
    socket.on("room:error", handleRoomError);

    return () => {
      socket.off("room:updated", handleRoomUpdated);
      socket.off("queue:updated", handleQueueUpdated);
      socket.off("room:error", handleRoomError);
    };
  }, [connection.socket]);

  async function createPrivateRoom() {
    if (!connection.socket) {
      setStatusMessage("Realtime server is not connected.");
      return;
    }

    const response = await emitRoomCommand((ack) =>
      connection.socket!.emit(
        "room:create",
        {
          kind: "private",
          visibility: "private",
          playerCapacity: 8,
          seed: fallbackSeed,
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage, setServerTimeOffsetMs);
  }

  async function joinPrivateRoom(roomCode: string) {
    if (!connection.socket) {
      setStatusMessage("Realtime server is not connected.");
      return;
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    if (!normalizedCode) {
      setStatusMessage("Enter a room code first.");
      return;
    }

    const response = await emitRoomCommand((ack) =>
      connection.socket!.emit(
        "room:join",
        {
          roomCode: normalizedCode,
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage, setServerTimeOffsetMs);
  }

  async function joinMatchmakingQueue(kind: QueueKind) {
    if (!connection.socket) {
      setStatusMessage("Realtime server is not connected.");
      return;
    }

    const response = await emitQueueCommand((ack) =>
      connection.socket!.emit(
        "queue:join",
        {
          kind,
        },
        ack,
      ),
    );

    applyQueueResponse(response, setCurrentQueue, setLastError, setStatusMessage);
  }

  async function leaveCurrentQueue() {
    if (!connection.socket) {
      return;
    }

    const response = await emitQueueCommand((ack) =>
      connection.socket!.emit(
        "queue:leave",
        {},
        ack,
      ),
    );

    applyQueueResponse(response, setCurrentQueue, setLastError, setStatusMessage);
  }

  async function leaveCurrentRoom() {
    if (!connection.socket || !currentRoom) {
      return;
    }

    const response = await emitRoomCommand((ack) =>
      connection.socket!.emit(
        "room:leave",
        {
          roomId: currentRoom.roomId,
        },
        ack,
      ),
    );

    if (response.ok) {
      setCurrentRoom(null);
      setLastError(null);
      setStatusMessage(null);
      return;
    }

    setLastError(response.error);
    setStatusMessage(response.error.message);
  }

  async function startCurrentRoom() {
    if (!connection.socket || !currentRoom) {
      return;
    }

    const response = await emitRoomCommand((ack) =>
      connection.socket!.emit(
        "room:start",
        {
          roomId: currentRoom.roomId,
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage, setServerTimeOffsetMs);
  }

  async function submitSelectionBox(selectionBox: NormalizedSelectionBox) {
    if (!connection.socket || !currentRoom) {
      return false;
    }

    const response = await emitRoomCommand((ack) =>
      connection.socket!.emit(
        "room:move",
        {
          roomId: currentRoom.roomId,
          selectionBox,
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage, setServerTimeOffsetMs);
    return response.ok;
  }

  async function restartCurrentRoom() {
    if (!connection.socket || !currentRoom) {
      return;
    }

    const response = await emitRoomCommand((ack) =>
      connection.socket!.emit(
        "room:restart",
        {
          roomId: currentRoom.roomId,
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage, setServerTimeOffsetMs);
  }

  function clearStatus() {
    setStatusMessage(null);
    setLastError(null);
  }

  const userId = connection.session?.userId ?? null;
  const isHost =
    !!userId &&
    !!currentRoom &&
    currentRoom.hostUserId === userId;
  const canStartCurrentRoom =
    !!currentRoom &&
    currentRoom.status === "waiting" &&
    currentRoom.players.length >= 1 &&
    isHost;
  const hasReadySession = connection.status === "connected" && !!connection.session;

  return {
    connectionStatus: connection.status,
    userId,
    currentRoom: isAuthenticated ? currentRoom : null,
    currentQueue: isAuthenticated ? currentQueue : null,
    lastError: isAuthenticated ? lastError : null,
    statusMessage: isAuthenticated ? statusMessage : null,
    serverTimeOffsetMs: isAuthenticated ? serverTimeOffsetMs : 0,
    isReady: hasReadySession,
    isHost,
    canStartCurrentRoom,
    createPrivateRoom,
    joinPrivateRoom,
    joinMatchmakingQueue,
    leaveCurrentQueue,
    leaveCurrentRoom,
    startCurrentRoom,
    restartCurrentRoom,
    submitSelectionBox,
    clearStatus,
  };
}

function emitRoomCommand(
  emit: (ack: (response: RoomCommandResponse) => void) => void,
): Promise<RoomCommandResponse> {
  return new Promise((resolve) => {
    emit(resolve);
  });
}

function emitQueueCommand(
  emit: (ack: (response: QueueCommandResponse) => void) => void,
): Promise<QueueCommandResponse> {
  return new Promise((resolve) => {
    emit(resolve);
  });
}

function applyRoomResponse(
  response: RoomCommandResponse,
  setCurrentRoom: (room: RoomSnapshot | null) => void,
  setLastError: (error: RealtimeError | null) => void,
  setStatusMessage: (message: string | null) => void,
  setServerTimeOffsetMs: (offsetMs: number) => void,
) {
  if (response.ok) {
    setCurrentRoom(response.room);
    setLastError(null);
    setStatusMessage(null);
    setServerTimeOffsetMs(Date.parse(response.room.serverNow) - Date.now());
    return;
  }

  setLastError(response.error);
  setStatusMessage(response.error.message);
}

function applyQueueResponse(
  response: QueueCommandResponse,
  setCurrentQueue: (queue: MatchmakingQueueSnapshot | null) => void,
  setLastError: (error: RealtimeError | null) => void,
  setStatusMessage: (message: string | null) => void,
) {
  if (response.ok) {
    setCurrentQueue(response.queue);
    setLastError(null);
    setStatusMessage(null);
    return;
  }

  setLastError(response.error);
  setStatusMessage(response.error.message);
}
