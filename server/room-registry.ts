import { randomInt, randomUUID } from "node:crypto";

import { createMatchConfig } from "../lib/game/config";
import { applySelectionBoxToGame, createGameState, finishGame, synchronizeGameClock } from "../lib/game/state";
import type { GameState, MatchConfig, NormalizedSelectionBox } from "../lib/game/types";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  MatchId,
  RealtimeError,
  RoomCommandResponse,
  RoomId,
  RoomPlayerStateSnapshot,
  RoomSnapshot,
  RoomStatus,
  UserId,
} from "../lib/multiplayer/protocol";

const PRIVATE_ROOM_COUNTDOWN_MS = 5_000;

interface ConnectedPlayer {
  userId: UserId;
  socketId: string;
  displayName: string;
  handle: string;
  image: string | null;
}

interface ServerPlayerRecord {
  userId: UserId;
  displayName: string;
  handle: string;
  image: string | null;
  isHost: boolean;
  joinedAt: string;
  socketIds: Set<string>;
}

interface ServerRoomRecord {
  roomId: RoomId;
  roomCode: string;
  matchId: MatchId;
  kind: RoomSnapshot["kind"];
  visibility: RoomSnapshot["visibility"];
  status: RoomStatus;
  playerCapacity: number;
  countdownDurationMs: number;
  countdownEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  hostUserId: UserId;
  players: Map<UserId, ServerPlayerRecord>;
  playerGameStates: Map<UserId, GameState>;
  matchConfig: MatchConfig;
}

export class RoomRegistry {
  private readonly rooms = new Map<RoomId, ServerRoomRecord>();
  private readonly roomIdByCode = new Map<string, RoomId>();
  private readonly roomIdByUserId = new Map<UserId, RoomId>();

  createRoom(request: CreateRoomRequest, host: ConnectedPlayer): RoomCommandResponse {
    const existingRoomId = this.roomIdByUserId.get(host.userId);

    if (existingRoomId) {
      return failure("already-in-room", "You are already in a room.");
    }

    const createdAt = new Date().toISOString();
    const roomId = createServerId("room");
    const roomCode = createRoomCode(this.roomIdByCode);
    const matchId = createServerId("match");
    const matchConfig = createMatchConfig(
      request.seed ?? createServerId("seed"),
      request.configOverrides,
    );
    const playerCapacity = clampPlayerCapacity();
    const hostPlayer = createPlayerPresence(host, true, createdAt);

    const room: ServerRoomRecord = {
      roomId,
      roomCode,
      matchId,
      kind: request.kind ?? "private",
      visibility: request.visibility ?? "private",
      status: "waiting",
      playerCapacity,
      countdownDurationMs: PRIVATE_ROOM_COUNTDOWN_MS,
      countdownEndsAt: null,
      createdAt,
      updatedAt: createdAt,
      startedAt: null,
      finishedAt: null,
      hostUserId: host.userId,
      players: new Map([[host.userId, hostPlayer]]),
      playerGameStates: new Map(),
      matchConfig,
    };

    this.rooms.set(roomId, room);
    this.roomIdByCode.set(roomCode, roomId);
    this.roomIdByUserId.set(host.userId, roomId);

    return {
      ok: true,
      room: this.toRoomSnapshot(room, Date.now()),
    };
  }

  joinRoom(request: JoinRoomRequest, player: ConnectedPlayer): RoomCommandResponse {
    const roomId = this.roomIdByCode.get(request.roomCode.trim().toUpperCase());
    const room = roomId ? this.rooms.get(roomId) : undefined;

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    this.synchronizeRoom(room, Date.now());

    const existingRoomId = this.roomIdByUserId.get(player.userId);

    if (existingRoomId && existingRoomId !== room.roomId) {
      return failure("already-in-room", "You are already in a room.");
    }

    const existingPlayer = room.players.get(player.userId);

    if (existingPlayer) {
      existingPlayer.socketIds.add(player.socketId);
      room.players.set(player.userId, {
        ...existingPlayer,
        displayName: player.displayName,
        handle: player.handle,
        image: player.image,
      });
      room.updatedAt = new Date().toISOString();
      this.roomIdByUserId.set(player.userId, room.roomId);

      return {
        ok: true,
        room: this.toRoomSnapshot(room, Date.now()),
      };
    }

    if (room.players.size >= room.playerCapacity) {
      return failure("room-full", "Room is already full.");
    }

    room.players.set(
      player.userId,
      createPlayerPresence(player, false, new Date().toISOString()),
    );
    room.updatedAt = new Date().toISOString();
    this.roomIdByUserId.set(player.userId, room.roomId);

    return {
      ok: true,
      room: this.toRoomSnapshot(room, Date.now()),
    };
  }

  leaveRoom(roomId: RoomId, userId: UserId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    this.synchronizeRoom(room, Date.now());

    if (!room.players.has(userId)) {
      return failure("not-in-room", "Player is not in this room.");
    }

    room.players.delete(userId);
    room.playerGameStates.delete(userId);
    room.updatedAt = new Date().toISOString();
    this.roomIdByUserId.delete(userId);

    if (room.players.size === 0) {
      room.status = "finished";
      room.finishedAt ??= room.updatedAt;
      this.rooms.delete(roomId);
      this.roomIdByCode.delete(room.roomCode);

      return {
        ok: true,
        room: {
          ...this.toRoomSnapshot(room, Date.now()),
          players: [],
          playerStates: [],
        },
      };
    }

    if (room.status !== "waiting" && room.finishedAt === null) {
      this.finishRoomForDeparture(room, Date.now());
    }

    if (room.hostUserId === userId) {
      const nextHost = room.players.values().next().value as ServerPlayerRecord | undefined;

      if (nextHost) {
        room.hostUserId = nextHost.userId;
        room.players.set(nextHost.userId, {
          ...nextHost,
          isHost: true,
        });
      }
    }

    return {
      ok: true,
      room: this.toRoomSnapshot(room, Date.now()),
    };
  }

  disconnectSession(userId: UserId, socketId: string, roomId: RoomId | null): RoomSnapshot | null {
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const player = room.players.get(userId);

    if (!player) {
      return null;
    }

    player.socketIds.delete(socketId);

    if (player.socketIds.size > 0) {
      room.updatedAt = new Date().toISOString();
      return this.toRoomSnapshot(room, Date.now());
    }

    const result = this.leaveRoom(roomId, userId);

    return result.ok ? result.room : null;
  }

  getRoom(roomId: RoomId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    return {
      ok: true,
      room: this.toRoomSnapshot(room, Date.now()),
    };
  }

  startMatch(roomId: RoomId, userId: UserId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    this.synchronizeRoom(room, Date.now());

    if (room.hostUserId !== userId) {
      return failure("not-host", "Only the host can start this room.");
    }

    if (room.players.size < 1) {
      return failure("room-not-ready", "At least 1 player is required to start the room.");
    }

    if (room.status !== "waiting") {
      return failure("invalid-request", "This room has already started.");
    }

    const nowMs = Date.now();
    const countdownEndsAt = new Date(nowMs + room.countdownDurationMs).toISOString();

    room.status = "countdown";
    room.countdownEndsAt = countdownEndsAt;
    room.startedAt = countdownEndsAt;
    room.finishedAt = null;
    room.updatedAt = new Date(nowMs).toISOString();
    room.playerGameStates = new Map(
      [...room.players.keys()].map((playerSessionId) => [
        playerSessionId,
        createGameState(room.matchConfig),
      ]),
    );

    return {
      ok: true,
      room: this.toRoomSnapshot(room, nowMs),
    };
  }

  restartMatch(roomId: RoomId, userId: UserId): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    this.synchronizeRoom(room, Date.now());

    if (room.hostUserId !== userId) {
      return failure("not-host", "Only the host can restart this room.");
    }

    if (room.players.size < 1) {
      return failure("room-not-ready", "At least 1 player is required to restart the room.");
    }

    if (room.status !== "finished") {
      return failure("invalid-request", "This room can only be restarted after the match finishes.");
    }

    const nowIso = new Date().toISOString();

    room.matchId = createServerId("match");
    room.status = "waiting";
    room.countdownEndsAt = null;
    room.startedAt = null;
    room.finishedAt = null;
    room.updatedAt = nowIso;
    room.playerGameStates = new Map();
    room.matchConfig = createNextMatchConfig(room.matchConfig);

    return {
      ok: true,
      room: this.toRoomSnapshot(room, Date.now()),
    };
  }

  submitMove(
    roomId: RoomId,
    userId: UserId,
    selectionBox: NormalizedSelectionBox,
  ): RoomCommandResponse {
    const room = this.rooms.get(roomId);

    if (!room) {
      return failure("room-not-found", "Room was not found.");
    }

    const nowMs = Date.now();
    this.synchronizeRoom(room, nowMs);

    if (room.status !== "active" || !room.startedAt) {
      return failure("invalid-request", "Match is not active.");
    }

    const currentState = room.playerGameStates.get(userId);

    if (!currentState) {
      return failure("not-in-room", "Player is not in this room.");
    }

    const elapsedMs = Math.max(0, nowMs - Date.parse(room.startedAt));
    const syncedState = synchronizeGameClock(currentState, elapsedMs);
    const nextState = applySelectionBoxToGame(syncedState, selectionBox);

    room.playerGameStates.set(userId, nextState);
    room.updatedAt = new Date(nowMs).toISOString();
    this.synchronizeRoom(room, nowMs);

    return {
      ok: true,
      room: this.toRoomSnapshot(room, nowMs),
    };
  }

  private toRoomSnapshot(room: ServerRoomRecord, nowMs: number): RoomSnapshot {
    this.synchronizeRoom(room, nowMs);

    return {
      serverNow: new Date(nowMs).toISOString(),
      roomId: room.roomId,
      roomCode: room.roomCode,
      matchId: room.matchId,
      kind: room.kind,
      visibility: room.visibility,
      status: room.status,
      playerCapacity: room.playerCapacity,
      countdownDurationMs: room.countdownDurationMs,
      countdownEndsAt: room.countdownEndsAt,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
      hostUserId: room.hostUserId,
      players: [...room.players.values()].map((player) => ({
        userId: player.userId,
        displayName: player.displayName,
        handle: player.handle,
        image: player.image,
        isHost: player.isHost,
        joinedAt: player.joinedAt,
      })),
      playerStates: createRoomPlayerStates(room),
      matchConfig: room.matchConfig,
    };
  }

  private synchronizeRoom(room: ServerRoomRecord, nowMs: number) {
    if (!room.startedAt) {
      return;
    }

    const startedAtMs = Date.parse(room.startedAt);

    if (room.status === "countdown" && nowMs >= startedAtMs) {
      room.status = "active";
      room.updatedAt = new Date(nowMs).toISOString();
    }

    if (nowMs < startedAtMs) {
      return;
    }

    for (const [sessionId, state] of room.playerGameStates) {
      room.playerGameStates.set(
        sessionId,
        synchronizeGameClock(state, nowMs - startedAtMs),
      );
    }

    if (
      room.playerGameStates.size > 0 &&
      [...room.playerGameStates.values()].every((state) => state.status === "ended")
    ) {
      room.status = "finished";
      room.finishedAt ??= new Date(nowMs).toISOString();
      room.updatedAt = new Date(nowMs).toISOString();
    }
  }

  private finishRoomForDeparture(room: ServerRoomRecord, nowMs: number) {
    room.status = "finished";
    room.finishedAt = new Date(nowMs).toISOString();
    room.updatedAt = room.finishedAt;

    for (const [sessionId, state] of room.playerGameStates) {
      room.playerGameStates.set(
        sessionId,
        finishGame(state, "manual-stop"),
      );
    }
  }
}

function createRoomPlayerStates(room: ServerRoomRecord): RoomPlayerStateSnapshot[] {
  return [...room.players.values()].map((player) => {
    const gameState = room.playerGameStates.get(player.userId) ?? null;

    return {
      userId: player.userId,
      displayName: player.displayName,
      handle: player.handle,
      image: player.image,
      isHost: player.isHost,
      score: gameState?.score ?? 0,
      gameState,
    };
  });
}

function createPlayerPresence(
  player: ConnectedPlayer,
  isHost: boolean,
  joinedAt: string,
): ServerPlayerRecord {
  return {
    userId: player.userId,
    displayName: player.displayName,
    handle: player.handle,
    image: player.image,
    isHost,
    joinedAt,
    socketIds: new Set([player.socketId]),
  };
}

function createNextMatchConfig(previousConfig: MatchConfig): MatchConfig {
  return createMatchConfig(createServerId("seed"), {
    rows: previousConfig.rows,
    cols: previousConfig.cols,
    durationMs: previousConfig.durationMs,
    targetSum: previousConfig.targetSum,
    fruitKinds: previousConfig.fruitKinds,
    minFruitValue: previousConfig.minFruitValue,
    maxFruitValue: previousConfig.maxFruitValue,
  });
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

function clampPlayerCapacity(): number {
  return 8;
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
