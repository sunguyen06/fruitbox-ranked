import { prisma } from "@/lib/db";
import {
  applyRatingDelta,
  getMatchmakingKFactor,
  resolveHeadToHeadRatingDeltas,
  type RatedMatchKind,
} from "@/lib/ranks";
import type { RoomSnapshot } from "@/lib/multiplayer";

const finalizedMatchIds = new Set<string>();

export interface AppliedRoomRating {
  userId: string;
  kind: RatedMatchKind;
  previousRating: number;
  nextRating: number;
  delta: number;
}

export async function maybeApplyRoomRatings(room: RoomSnapshot) {
  const kind = getRatedMatchKind(room);

  if (!kind || !isEligibleFinishedMatch(room) || finalizedMatchIds.has(room.matchId)) {
    return null;
  }

  finalizedMatchIds.add(room.matchId);

  try {
    return await applyHeadToHeadRatings(room, kind);
  } catch (error) {
    finalizedMatchIds.delete(room.matchId);
    throw error;
  }
}

function getRatedMatchKind(room: RoomSnapshot): RatedMatchKind | null {
  if (room.kind === "ranked" || room.kind === "casual") {
    return room.kind;
  }

  return null;
}

function isEligibleFinishedMatch(room: RoomSnapshot) {
  if (room.visibility !== "public" || room.status !== "finished" || room.playerStates.length !== 2) {
    return false;
  }

  return room.playerStates.every((playerState) => {
    const result = playerState.gameState?.result;

    return (
      playerState.gameState?.status === "ended" &&
      result?.endReason !== "manual-stop"
    );
  });
}

async function applyHeadToHeadRatings(room: RoomSnapshot, kind: RatedMatchKind) {
  const [leftPlayer, rightPlayer] = room.playerStates;

  if (!leftPlayer || !rightPlayer) {
    return null;
  }

  const profiles = await prisma.profile.findMany({
    where: {
      userId: {
        in: [leftPlayer.userId, rightPlayer.userId],
      },
    },
    select: {
      userId: true,
      rankedElo: true,
      casualMmr: true,
    },
  });
  const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
  const leftProfile = profileByUserId.get(leftPlayer.userId);
  const rightProfile = profileByUserId.get(rightPlayer.userId);

  if (!leftProfile || !rightProfile) {
    return null;
  }

  const leftRating = kind === "ranked" ? leftProfile.rankedElo : leftProfile.casualMmr;
  const rightRating = kind === "ranked" ? rightProfile.rankedElo : rightProfile.casualMmr;
  const deltas = resolveHeadToHeadRatingDeltas(
    leftRating,
    rightRating,
    resolveOutcome(leftPlayer.score, rightPlayer.score),
    getMatchmakingKFactor(kind),
  );
  const leftNextRating = applyRatingDelta(leftRating, deltas.leftDelta);
  const rightNextRating = applyRatingDelta(rightRating, deltas.rightDelta);

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: leftPlayer.userId },
      data:
        kind === "ranked"
          ? { rankedElo: leftNextRating }
          : { casualMmr: leftNextRating },
    }),
    prisma.profile.update({
      where: { userId: rightPlayer.userId },
      data:
        kind === "ranked"
          ? { rankedElo: rightNextRating }
          : { casualMmr: rightNextRating },
    }),
  ]);

  return [
    {
      userId: leftPlayer.userId,
      kind,
      previousRating: leftRating,
      nextRating: leftNextRating,
      delta: leftNextRating - leftRating,
    },
    {
      userId: rightPlayer.userId,
      kind,
      previousRating: rightRating,
      nextRating: rightNextRating,
      delta: rightNextRating - rightRating,
    },
  ] satisfies AppliedRoomRating[];
}

function resolveOutcome(leftScore: number, rightScore: number) {
  if (leftScore === rightScore) {
    return "draw";
  }

  return leftScore > rightScore ? "left-win" : "right-win";
}
