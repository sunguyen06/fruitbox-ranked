export interface RankTier {
  name: "Apple" | "Pear" | "Banana" | "Mango" | "Pineapple" | "Melon";
  emoji: string;
  minElo: number;
  maxElo: number | null;
}

export type RatedMatchKind = "ranked" | "casual";
export type HeadToHeadOutcome = "left-win" | "right-win" | "draw";

export const RANKED_ELO_K_FACTOR = 32;
export const CASUAL_MMR_K_FACTOR = 24;

export const RANK_TIERS: RankTier[] = [
  { name: "Apple", emoji: "🍎", minElo: 0, maxElo: 599 },
  { name: "Pear", emoji: "🍐", minElo: 600, maxElo: 899 },
  { name: "Banana", emoji: "🍌", minElo: 900, maxElo: 1199 },
  { name: "Mango", emoji: "🥭", minElo: 1200, maxElo: 1599 },
  { name: "Pineapple", emoji: "🍍", minElo: 1600, maxElo: 1999 },
  { name: "Melon", emoji: "🍈", minElo: 2000, maxElo: null },
];

export function getRankTier(elo: number): RankTier {
  const normalizedElo = Math.max(0, Math.floor(elo));

  return (
    RANK_TIERS.find((tier) =>
      tier.maxElo === null
        ? normalizedElo >= tier.minElo
        : normalizedElo >= tier.minElo && normalizedElo <= tier.maxElo,
    ) ?? RANK_TIERS[0]
  );
}

export function getMatchmakingKFactor(kind: RatedMatchKind) {
  return kind === "ranked" ? RANKED_ELO_K_FACTOR : CASUAL_MMR_K_FACTOR;
}

export function getExpectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function resolveHeadToHeadRatingDeltas(
  leftRating: number,
  rightRating: number,
  outcome: HeadToHeadOutcome,
  kFactor: number,
) {
  const expectedLeft = getExpectedScore(leftRating, rightRating);
  const actualLeft =
    outcome === "draw"
      ? 0.5
      : outcome === "left-win"
        ? 1
        : 0;
  let leftDelta = Math.round(kFactor * (actualLeft - expectedLeft));

  if (outcome !== "draw" && leftDelta === 0) {
    leftDelta = outcome === "left-win" ? 1 : -1;
  }

  return {
    leftDelta,
    rightDelta: -leftDelta,
    expectedLeft,
    expectedRight: 1 - expectedLeft,
  };
}

export function applyRatingDelta(rating: number, delta: number) {
  return Math.max(0, Math.round(rating + delta));
}
