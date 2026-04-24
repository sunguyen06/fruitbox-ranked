import type {
  MatchmakingQueueSnapshot,
  QueueCommandResponse,
  QueueKind,
  RealtimeError,
  UserId,
} from "../lib/multiplayer/protocol";

export interface MatchmakingPlayer {
  userId: UserId;
  socketId: string;
  displayName: string;
  handle: string;
  image: string | null;
  rankedElo: number;
  casualMmr: number;
}

interface MatchmakingQueueEntry {
  kind: QueueKind;
  queuedAtMs: number;
  player: MatchmakingPlayer;
}

export interface MatchmakingPair {
  kind: QueueKind;
  players: [MatchmakingPlayer, MatchmakingPlayer];
}

const SEARCH_WINDOW_BASE: Record<QueueKind, number> = {
  ranked: 100,
  casual: 150,
};

const SEARCH_WINDOW_GROWTH: Record<QueueKind, number> = {
  ranked: 50,
  casual: 75,
};

const SEARCH_WINDOW_MAX: Record<QueueKind, number> = {
  ranked: 600,
  casual: 800,
};

export class MatchmakingService {
  private readonly queues: Record<QueueKind, MatchmakingQueueEntry[]> = {
    ranked: [],
    casual: [],
  };

  private readonly queueByUserId = new Map<UserId, MatchmakingQueueEntry>();

  joinQueue(player: MatchmakingPlayer, kind: QueueKind): QueueCommandResponse {
    this.removePlayer(player.userId);

    const entry: MatchmakingQueueEntry = {
      kind,
      queuedAtMs: Date.now(),
      player,
    };

    this.queues[kind].push(entry);
    this.queueByUserId.set(player.userId, entry);

    return {
      ok: true,
      queue: toQueueSnapshot(entry),
    };
  }

  leaveQueue(userId: UserId, kind?: QueueKind): QueueCommandResponse {
    const entry = this.queueByUserId.get(userId);

    if (!entry || (kind && entry.kind !== kind)) {
      return failure("not-in-queue", "You are not currently in that queue.");
    }

    this.removePlayer(userId);

    return {
      ok: true,
      queue: null,
    };
  }

  clearDisconnectedPlayer(userId: UserId, socketId: string) {
    const entry = this.queueByUserId.get(userId);

    if (entry?.player.socketId === socketId) {
      this.removePlayer(userId);
    }
  }

  requeuePlayers(entries: MatchmakingPlayer[], kind: QueueKind) {
    const nowMs = Date.now();

    for (const player of entries) {
      if (this.queueByUserId.has(player.userId)) {
        continue;
      }

      const entry: MatchmakingQueueEntry = {
        kind,
        queuedAtMs: nowMs,
        player,
      };

      this.queues[kind].unshift(entry);
      this.queueByUserId.set(player.userId, entry);
    }
  }

  findReadyMatches(nowMs = Date.now()): MatchmakingPair[] {
    const matches: MatchmakingPair[] = [];

    for (const kind of ["ranked", "casual"] as const) {
      while (true) {
        const match = this.findMatchForQueue(kind, nowMs);

        if (!match) {
          break;
        }

        matches.push(match);
      }
    }

    return matches;
  }

  getQueueSnapshot(userId: UserId): MatchmakingQueueSnapshot | null {
    const entry = this.queueByUserId.get(userId);

    return entry ? toQueueSnapshot(entry) : null;
  }

  private findMatchForQueue(kind: QueueKind, nowMs: number): MatchmakingPair | null {
    const queue = this.queues[kind];

    for (let leftIndex = 0; leftIndex < queue.length; leftIndex += 1) {
      const leftEntry = queue[leftIndex]!;

      for (let rightIndex = leftIndex + 1; rightIndex < queue.length; rightIndex += 1) {
        const rightEntry = queue[rightIndex]!;

        if (!canMatch(leftEntry, rightEntry, nowMs)) {
          continue;
        }

        queue.splice(rightIndex, 1);
        queue.splice(leftIndex, 1);
        this.queueByUserId.delete(leftEntry.player.userId);
        this.queueByUserId.delete(rightEntry.player.userId);

        return {
          kind,
          players: [leftEntry.player, rightEntry.player],
        };
      }
    }

    return null;
  }

  private removePlayer(userId: UserId) {
    const entry = this.queueByUserId.get(userId);

    if (!entry) {
      return;
    }

    this.queueByUserId.delete(userId);
    const queue = this.queues[entry.kind];
    const index = queue.findIndex((candidate) => candidate.player.userId === userId);

    if (index >= 0) {
      queue.splice(index, 1);
    }
  }
}

function canMatch(
  leftEntry: MatchmakingQueueEntry,
  rightEntry: MatchmakingQueueEntry,
  nowMs: number,
) {
  const ratingDelta = Math.abs(getRating(leftEntry) - getRating(rightEntry));
  const leftWindow = getSearchWindow(leftEntry.kind, nowMs - leftEntry.queuedAtMs);
  const rightWindow = getSearchWindow(rightEntry.kind, nowMs - rightEntry.queuedAtMs);

  return ratingDelta <= Math.min(leftWindow, rightWindow);
}

function getRating(entry: MatchmakingQueueEntry) {
  return entry.kind === "ranked" ? entry.player.rankedElo : entry.player.casualMmr;
}

function getSearchWindow(kind: QueueKind, waitMs: number) {
  const base = SEARCH_WINDOW_BASE[kind];
  const growth = SEARCH_WINDOW_GROWTH[kind] * Math.floor(Math.max(0, waitMs) / 5_000);

  return Math.min(SEARCH_WINDOW_MAX[kind], base + growth);
}

function toQueueSnapshot(entry: MatchmakingQueueEntry): MatchmakingQueueSnapshot {
  return {
    kind: entry.kind,
    queuedAt: new Date(entry.queuedAtMs).toISOString(),
  };
}

function failure(code: RealtimeError["code"], message: string): QueueCommandResponse {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
