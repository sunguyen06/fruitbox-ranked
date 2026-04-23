import { randomUUID } from "node:crypto";

import { MatchCompletionReason, MatchStatus, MatchKind, MatchVisibility, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { RoomSnapshot } from "@/lib/multiplayer";

interface PersistOptions {
  completionReason?: MatchCompletionReason;
  forceStatus?: MatchStatus;
}

export async function persistRoomSnapshot(
  room: RoomSnapshot,
  options: PersistOptions = {},
) {
  const status = options.forceStatus ?? toMatchStatus(room.status);
  const completionReason =
    options.completionReason ??
    (status === MatchStatus.FINISHED ? deriveCompletionReason(room) : null);

  await prisma.match.upsert({
    where: { id: room.matchId },
    create: {
      id: room.matchId,
      roomCode: room.roomCode,
      seed: room.matchConfig.seed,
      kind: toMatchKind(room.kind),
      visibility: toMatchVisibility(room.visibility),
      status,
      completionReason,
      hostUserId: room.hostUserId,
      playerCapacity: room.playerCapacity,
      countdownDurationMs: room.countdownDurationMs,
      participantCount: room.players.length,
      configJson: room.matchConfig as unknown as Prisma.InputJsonValue,
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
      startedAt: room.startedAt ? new Date(room.startedAt) : null,
      finishedAt: room.finishedAt ? new Date(room.finishedAt) : null,
    },
    update: {
      roomCode: room.roomCode,
      seed: room.matchConfig.seed,
      kind: toMatchKind(room.kind),
      visibility: toMatchVisibility(room.visibility),
      status,
      completionReason,
      hostUserId: room.hostUserId,
      playerCapacity: room.playerCapacity,
      countdownDurationMs: room.countdownDurationMs,
      participantCount: room.players.length,
      configJson: room.matchConfig as unknown as Prisma.InputJsonValue,
      updatedAt: new Date(room.updatedAt),
      startedAt: room.startedAt ? new Date(room.startedAt) : null,
      finishedAt: room.finishedAt ? new Date(room.finishedAt) : null,
    },
  });

  const placements = createPlacements(room);

  await Promise.all(
    room.players.map((player) => {
      const playerState =
        room.playerStates.find((candidate) => candidate.userId === player.userId) ?? null;
      const metadata = player.image
        ? ({ image: player.image } as Prisma.InputJsonValue)
        : undefined;

      return prisma.matchParticipant.upsert({
        where: {
          matchId_userId: {
            matchId: room.matchId,
            userId: player.userId,
          },
        },
        create: {
          id: `participant_${randomUUID().replace(/-/g, "").slice(0, 10)}`,
          matchId: room.matchId,
          userId: player.userId,
          displayNameSnapshot: player.displayName,
          handleSnapshot: player.handle,
          joinedAt: new Date(player.joinedAt),
          finishedAt: room.finishedAt ? new Date(room.finishedAt) : null,
          score: playerState?.score ?? null,
          placement: placements.get(player.userId) ?? null,
          wasHost: player.isHost,
          didFinish: playerState?.gameState?.status === "ended",
          metadata,
        },
        update: {
          displayNameSnapshot: player.displayName,
          handleSnapshot: player.handle,
          finishedAt: room.finishedAt ? new Date(room.finishedAt) : null,
          score: playerState?.score ?? null,
          placement: placements.get(player.userId) ?? null,
          wasHost: player.isHost,
          didFinish: playerState?.gameState?.status === "ended",
          metadata,
        },
      });
    }),
  );
}

function createPlacements(room: RoomSnapshot) {
  const standings = [...room.playerStates].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.displayName.localeCompare(right.displayName);
  });
  const placements = new Map<string, number>();

  standings.forEach((player, index) => {
    placements.set(player.userId, index + 1);
  });

  return placements;
}

function deriveCompletionReason(room: RoomSnapshot): MatchCompletionReason {
  if (room.players.length === 0) {
    return MatchCompletionReason.EMPTY_ROOM;
  }

  const hasManualStop = room.playerStates.some(
    (playerState) => playerState.gameState?.endReason === "manual-stop",
  );

  return hasManualStop ? MatchCompletionReason.MANUAL_STOP : MatchCompletionReason.NORMAL;
}

function toMatchKind(kind: RoomSnapshot["kind"]): MatchKind {
  switch (kind) {
    case "casual":
      return MatchKind.CASUAL;
    case "ranked":
      return MatchKind.RANKED;
    default:
      return MatchKind.PRIVATE;
  }
}

function toMatchVisibility(visibility: RoomSnapshot["visibility"]): MatchVisibility {
  return visibility === "public" ? MatchVisibility.PUBLIC : MatchVisibility.PRIVATE;
}

function toMatchStatus(status: RoomSnapshot["status"]): MatchStatus {
  switch (status) {
    case "countdown":
    case "active":
      return MatchStatus.ACTIVE;
    case "finished":
      return MatchStatus.FINISHED;
    default:
      return MatchStatus.WAITING;
  }
}
