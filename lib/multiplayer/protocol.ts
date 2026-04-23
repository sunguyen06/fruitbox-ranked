import type { MatchConfigOverrides } from "../game/config";
import type { GameState, MatchConfig, NormalizedSelectionBox } from "../game/types";

export type UserId = string;
export type RoomId = string;
export type MatchId = string;

export type RoomVisibility = "private" | "public";
export type MatchKind = "private" | "casual" | "ranked";
export type RoomStatus = "waiting" | "countdown" | "active" | "finished";

export interface PlayerPresence {
  userId: UserId;
  displayName: string;
  handle: string;
  image: string | null;
  isHost: boolean;
  joinedAt: string;
}

export interface RoomPlayerStateSnapshot {
  userId: UserId;
  displayName: string;
  handle: string;
  image: string | null;
  isHost: boolean;
  score: number;
  gameState: GameState | null;
}

export interface RoomSnapshot {
  serverNow: string;
  roomId: RoomId;
  roomCode: string;
  matchId: MatchId;
  kind: MatchKind;
  visibility: RoomVisibility;
  status: RoomStatus;
  playerCapacity: number;
  countdownDurationMs: number;
  countdownEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  hostUserId: UserId;
  players: PlayerPresence[];
  playerStates: RoomPlayerStateSnapshot[];
  matchConfig: MatchConfig;
}

export interface RealtimeError {
  code:
    | "room-not-found"
    | "room-full"
    | "already-in-room"
    | "invalid-request"
    | "not-in-room"
    | "not-host"
    | "room-not-ready";
  message: string;
}

export interface SessionReadyPayload {
  userId: UserId;
  displayName: string;
  handle: string;
  image: string | null;
  connectedAt: string;
  serverVersion: string;
}

export interface CreateRoomRequest {
  seed?: string;
  kind?: MatchKind;
  visibility?: RoomVisibility;
  playerCapacity?: number;
  configOverrides?: MatchConfigOverrides;
}

export interface JoinRoomRequest {
  roomCode: string;
}

export interface LeaveRoomRequest {
  roomId: RoomId;
}

export interface GetRoomRequest {
  roomId: RoomId;
}

export interface StartRoomRequest {
  roomId: RoomId;
}

export interface SubmitMoveRequest {
  roomId: RoomId;
  selectionBox: NormalizedSelectionBox;
}

export type RoomCommandResponse =
  | {
      ok: true;
      room: RoomSnapshot;
    }
  | {
      ok: false;
      error: RealtimeError;
    };

export interface ClientToServerEvents {
  "client:ping": (
    payload: { sentAt: string },
    ack?: (response: { receivedAt: string }) => void,
  ) => void;
  "room:create": (
    request: CreateRoomRequest,
    ack: (response: RoomCommandResponse) => void,
  ) => void;
  "room:join": (
    request: JoinRoomRequest,
    ack: (response: RoomCommandResponse) => void,
  ) => void;
  "room:leave": (
    request: LeaveRoomRequest,
    ack: (response: RoomCommandResponse) => void,
  ) => void;
  "room:get": (
    request: GetRoomRequest,
    ack: (response: RoomCommandResponse) => void,
  ) => void;
  "room:start": (
    request: StartRoomRequest,
    ack: (response: RoomCommandResponse) => void,
  ) => void;
  "room:move": (
    request: SubmitMoveRequest,
    ack: (response: RoomCommandResponse) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "session:ready": (payload: SessionReadyPayload) => void;
  "server:pong": (payload: { receivedAt: string }) => void;
  "room:updated": (room: RoomSnapshot) => void;
  "room:error": (error: RealtimeError) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  userId: UserId;
  displayName: string;
  handle: string;
  image: string | null;
  roomId: RoomId | null;
}
