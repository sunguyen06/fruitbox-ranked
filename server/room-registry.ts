import { randomInt, randomUUID } from "node:crypto";

import { createMatchConfig } from "../lib/game/config";
import { createGameState } from "../lib/game/state";
import type { GameState, MatchConfig } from "../lib/game/types";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  MatchId,
  PlayerPresence,
  RealtimeError,
  RoomCommandResponse,
  RoomId,
  RoomSnapshot,
  RoomStatus,
  SessionId,
} from "../lib/multiplayer/protocol";

interface ConnectedPlayer {
  sessionId: SessionId;
  socketId: string;
  displayName: string;
}

interface ServerRoomRecord {
  roomId: RoomId;
  roomCode: string;
  matchId: MatchId;
  kind: RoomSnapshot["kind"];
  visibility: RoomSnapshot["visibility"];
  status: RoomStatus;
  playerCapacity: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  hostSessionId: SessionId;
  players: Map<SessionId, PlayerPresence>;
  matchConfig: MatchConfig;
  activeGameState: GameState | null;
}

export class RoomRegistry {
  private readonly rooms = new Map<RoomId, ServerRoomRecord>();
  private readonly roomIdByCode = new Map<string, RoomId>();

  createRoom(request: CreateRoomRequest, host: ConnectedPlayer): RoomCommandResponse {
    const roomId = createServerId("room");
    const roomCode = createRoomCode(this.roomIdByCode);
    const matchId = createServerId("match");
    const createdAt = new Date().toISOString();
    const matchConfig = createMatchConfig(
      request.seed ?? createServerId("seed"),
      request.configOverrides,
    );
    const playerCapacity = clampPlayerCapacity(request.playerCapacity);
    const hostPlayer = createPlayerPresence(host, true, createdAt);

    const room: ServerRoomRecord = {
      roomId,
      roomCode,
      matchId,
      kind: request.kind ?? "private",
      visibility: request.visibility ?? "private",
      status: "waiting",
      playerCapacity,
      createdAt,
      updatedAt: createdAt,
      startedAt: null,
      hostSessionId: host.sessionId,
      players: new Map([[host.sessionId, hostPlayer]]),
      matchConfig,
      activeGameState: null,
    };

    this.rooms.set(roomId, room);
    this.roomIdByCode.set(roomCode, roomId);

    return {
      ok: true,
      room: this.toRoomSnapshot(room),
    };
  }

  joinRoom(request: JoinRoomRequest, player: ConnectedPlayer): RoomCommandResponse {
    const roomId = this.roomIdByCode.get(request.roomCode.trim().toUpperCase());
    const room = roomId ? this.rooms.get(roomId) : undefined;

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    const existingPlayer = room.players.get(player.sessionId);

    if (existingPlayer) {
      room.players.set(player.sessionId, {
        ...existingPlayer,
        socketId: player.socketId,
        displayName: player.displayName,
      });
      room.updatedAt = new Date().toISOString();

      return {
        ok: true,
        room: this.toRoomSnapshot(room),
      };
    }

    if (room.players.size >= room.playerCapacity) {
      return failure("room-full", "Room is already full.");
    }

    room.players.set(
      player.sessionId,
      createPlayerPresence(player, false, new Date().toISOString()),
    );
    room.updatedAt = new Date().toISOString();

    return {
      ok: true,
      room: this.toRoomSnapshot(room),
    };
  }

  leaveRoom(roomId: RoomId, sessionId: SessionId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    if (!room.players.has(sessionId)) {
      return failure("not-in-room", "Player is not in this room.");
    }

    room.players.delete(sessionId);
    room.updatedAt = new Date().toISOString();

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      this.roomIdByCode.delete(room.roomCode);

      return {
        ok: true,
        room: {
          ...this.toRoomSnapshot(room),
          players: [],
        },
      };
    }

    if (room.hostSessionId === sessionId) {
      const nextHost = room.players.values().next().value as PlayerPresence | undefined;

      if (nextHost) {
        room.hostSessionId = nextHost.sessionId;
        room.players.set(nextHost.sessionId, {
          ...nextHost,
          isHost: true,
        });
      }
    }

    return {
      ok: true,
      room: this.toRoomSnapshot(room),
    };
  }

  disconnectSession(sessionId: SessionId, roomId: RoomId | null): RoomSnapshot | null {
    if (!roomId) {
      return null;
    }

    const result = this.leaveRoom(roomId, sessionId);

    return result.ok ? result.room : null;
  }

  getRoom(roomId: RoomId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    return {
      ok: true,
      room: this.toRoomSnapshot(room),
    };
  }

  startMatch(roomId: RoomId, sessionId: SessionId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    if (room.hostSessionId !== sessionId) {
      return failure("not-host", "Only the host can start this room.");
    }

    if (room.players.size < room.playerCapacity) {
      return failure("room-not-ready", "Waiting for both players to join the room.");
    }

    if (room.status !== "waiting") {
      return failure("invalid-request", "This room has already started.");
    }

    room.status = "active";
    room.startedAt = new Date().toISOString();
    room.updatedAt = room.startedAt;
    room.activeGameState = createGameState(room.matchConfig);

    return {
      ok: true,
      room: this.toRoomSnapshot(room),
    };
  }

  private toRoomSnapshot(room: ServerRoomRecord): RoomSnapshot {
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      matchId: room.matchId,
      kind: room.kind,
      visibility: room.visibility,
      status: room.status,
      playerCapacity: room.playerCapacity,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      startedAt: room.startedAt,
      hostSessionId: room.hostSessionId,
      players: [...room.players.values()],
      matchConfig: room.matchConfig,
      activeGameState: room.activeGameState,
    };
  }
}

function createPlayerPresence(
  player: ConnectedPlayer,
  isHost: boolean,
  joinedAt: string,
): PlayerPresence {
  return {
    sessionId: player.sessionId,
    socketId: player.socketId,
    displayName: player.displayName,
    isHost,
    joinedAt,
  };
}

function failure(code: RealtimeError["code"], message: string): RoomCommandResponse {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function clampPlayerCapacity(value: number | undefined): number {
  if (!value) {
    return 2;
  }

  return Math.max(2, Math.min(2, value));
}

function createServerId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function createRoomCode(index: Map<string, RoomId>): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  do {
    code = Array.from({ length: 6 }, () => alphabet[randomInt(0, alphabet.length)]).join("");
  } while (index.has(code));

  return code;
}
