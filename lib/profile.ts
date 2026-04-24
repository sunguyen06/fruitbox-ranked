import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export interface ProfileIdentityInput {
  userId: string;
  email: string;
  name: string;
  image: string | null;
}

export interface ProfileIdentity {
  userId: string;
  email: string;
  image: string | null;
  displayName: string;
  handle: string;
  rankedElo: number;
  casualMmr: number;
  createdAt: string;
}

export interface MatchHistoryEntry {
  id: string;
  joinedAt: string;
  score: number | null;
  placement: number | null;
  didFinish: boolean;
  wasHost: boolean;
  displayNameSnapshot: string;
  handleSnapshot: string | null;
  match: {
    id: string;
    roomCode: string | null;
    seed: string;
    kind: string;
    visibility: string;
    status: string;
    completionReason: string | null;
    participantCount: number;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    participants: Array<{
      userId: string;
      displayNameSnapshot: string;
      handleSnapshot: string | null;
      score: number | null;
      placement: number | null;
    }>;
  };
}

export async function ensureProfileIdentity(input: ProfileIdentityInput): Promise<ProfileIdentity> {
  const existing = await prisma.profile.findUnique({
    where: { userId: input.userId },
  });

  if (existing) {
    return {
      userId: input.userId,
      email: input.email,
      image: input.image,
      displayName: existing.displayName,
      handle: existing.handle,
      rankedElo: existing.rankedElo,
      casualMmr: existing.casualMmr,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const fallbackDisplayName = normalizeDisplayName(input.name, input.email);
  const handle = await buildUniqueHandle(fallbackDisplayName, input.email);
  const created = await prisma.profile.create({
    data: {
      userId: input.userId,
      displayName: fallbackDisplayName,
      handle,
    },
  });

  return {
    userId: input.userId,
    email: input.email,
    image: input.image,
    displayName: created.displayName,
    handle: created.handle,
    rankedElo: created.rankedElo,
    casualMmr: created.casualMmr,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getMatchHistoryForUser(userId: string): Promise<MatchHistoryEntry[]> {
  const rows = await prisma.matchParticipant.findMany({
    where: { userId },
    include: {
      match: {
        include: {
          participants: {
            orderBy: [
              { placement: "asc" },
              { score: "desc" },
              { joinedAt: "asc" },
            ],
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
    take: 12,
  });

  return rows.map((row) => ({
    id: row.id,
    joinedAt: row.joinedAt.toISOString(),
    score: row.score,
    placement: row.placement,
    didFinish: row.didFinish,
    wasHost: row.wasHost,
    displayNameSnapshot: row.displayNameSnapshot,
    handleSnapshot: row.handleSnapshot,
    match: {
      id: row.match.id,
      roomCode: row.match.roomCode,
      seed: row.match.seed,
      kind: row.match.kind,
      visibility: row.match.visibility,
      status: row.match.status,
      completionReason: row.match.completionReason,
      participantCount: row.match.participantCount,
      createdAt: row.match.createdAt.toISOString(),
      startedAt: row.match.startedAt?.toISOString() ?? null,
      finishedAt: row.match.finishedAt?.toISOString() ?? null,
      participants: row.match.participants.map((participant) => ({
        userId: participant.userId,
        displayNameSnapshot: participant.displayNameSnapshot,
        handleSnapshot: participant.handleSnapshot,
        score: participant.score,
        placement: participant.placement,
      })),
    },
  }));
}

export function normalizeDisplayName(name: string, email: string): string {
  const normalized = name.trim();

  if (normalized) {
    return normalized.slice(0, 32);
  }

  return email.split("@")[0]!.slice(0, 32);
}

export function normalizeHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 20);
}

async function buildUniqueHandle(name: string, email: string): Promise<string> {
  const base =
    normalizeHandle(name) ||
    normalizeHandle(email.split("@")[0] ?? "") ||
    `player-${randomUUID().slice(0, 6)}`;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0
        ? base
        : `${base.slice(0, Math.max(1, 20 - String(attempt + 1).length))}${attempt + 1}`;
    const existing = await prisma.profile.findUnique({
      where: { handle: candidate },
      select: { userId: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base.slice(0, 13)}-${randomUUID().slice(0, 6)}`;
}

export function isUniqueConstraintError(
  error: unknown,
  fieldName: string,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(fieldName)
  );
}
