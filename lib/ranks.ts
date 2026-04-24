export interface RankTier {
  name: "Apple" | "Pear" | "Banana" | "Mango" | "Pineapple" | "Melon";
  emoji: string;
  minElo: number;
  maxElo: number | null;
}

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

