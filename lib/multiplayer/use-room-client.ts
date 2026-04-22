"use client";

import { useEffect, useState } from "react";

import { useRealtimeConnection } from "./use-realtime-connection";
import type {
  RealtimeError,
  RoomCommandResponse,
  RoomSnapshot,
} from "./protocol";

export interface RoomClientState {
  connectionStatus: "disabled" | "connecting" | "connected" | "disconnected";
  sessionId: string | null;
  currentRoom: RoomSnapshot | null;
  lastError: RealtimeError | null;
  statusMessage: string | null;
  isReady: boolean;
  isHost: boolean;
  canStartCurrentRoom: boolean;
  createPrivateRoom: () => Promise<void>;
  joinPrivateRoom: (roomCode: string) => Promise<void>;
  leaveCurrentRoom: () => Promise<void>;
  startCurrentRoom: () => Promise<void>;
  clearStatus: () => void;
}

export function useRoomClient(): RoomClientState {
  const connection = useRealtimeConnection();
  const [currentRoom, setCurrentRoom] = useState<RoomSnapshot | null>(null);
  const [lastError, setLastError] = useState<RealtimeError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const socket = connection.socket;

    if (!socket) {
      return;
    }

    const handleRoomUpdated = (room: RoomSnapshot) => {
      setCurrentRoom(room);
      setLastError(null);
    };

    const handleRoomError = (error: RealtimeError) => {
      setLastError(error);
      setStatusMessage(error.message);
    };

    socket.on("room:updated", handleRoomUpdated);
    socket.on("room:error", handleRoomError);

    return () => {
      socket.off("room:updated", handleRoomUpdated);
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
          playerCapacity: 2,
          displayName: "Player",
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage);
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
          displayName: "Player",
        },
        ack,
      ),
    );

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage);
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

    applyRoomResponse(response, setCurrentRoom, setLastError, setStatusMessage);
  }

  function clearStatus() {
    setStatusMessage(null);
    setLastError(null);
  }

  const sessionId = connection.session?.sessionId ?? null;
  const isHost =
    !!sessionId &&
    !!currentRoom &&
    currentRoom.hostSessionId === sessionId;
  const canStartCurrentRoom =
    !!currentRoom &&
    currentRoom.status === "waiting" &&
    currentRoom.players.length >= currentRoom.playerCapacity &&
    isHost;

  return {
    connectionStatus: connection.status,
    sessionId,
    currentRoom,
    lastError,
    statusMessage,
    isReady: connection.status === "connected" && !!connection.session,
    isHost,
    canStartCurrentRoom,
    createPrivateRoom,
    joinPrivateRoom,
    leaveCurrentRoom,
    startCurrentRoom,
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

function applyRoomResponse(
  response: RoomCommandResponse,
  setCurrentRoom: (room: RoomSnapshot | null) => void,
  setLastError: (error: RealtimeError | null) => void,
  setStatusMessage: (message: string | null) => void,
) {
  if (response.ok) {
    setCurrentRoom(response.room);
    setLastError(null);
    setStatusMessage(null);
    return;
  }

  setLastError(response.error);
  setStatusMessage(response.error.message);
}
