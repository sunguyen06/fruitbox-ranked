"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_TIERS = exports.CASUAL_MMR_K_FACTOR = exports.RANKED_ELO_K_FACTOR = void 0;
exports.getRankTier = getRankTier;
exports.getMatchmakingKFactor = getMatchmakingKFactor;
exports.getExpectedScore = getExpectedScore;
exports.resolveHeadToHeadRatingDeltas = resolveHeadToHeadRatingDeltas;
exports.applyRatingDelta = applyRatingDelta;
exports.RANKED_ELO_K_FACTOR = 32;
exports.CASUAL_MMR_K_FACTOR = 24;
exports.RANK_TIERS = [
    { name: "Apple", emoji: "🍎", minElo: 0, maxElo: 599 },
    { name: "Pear", emoji: "🍐", minElo: 600, maxElo: 899 },
    { name: "Banana", emoji: "🍌", minElo: 900, maxElo: 1199 },
    { name: "Mango", emoji: "🥭", minElo: 1200, maxElo: 1599 },
    { name: "Pineapple", emoji: "🍍", minElo: 1600, maxElo: 1999 },
    { name: "Melon", emoji: "🍈", minElo: 2000, maxElo: null },
];
function getRankTier(elo) {
    var _a;
    const normalizedElo = Math.max(0, Math.floor(elo));
    return ((_a = exports.RANK_TIERS.find((tier) => tier.maxElo === null
        ? normalizedElo >= tier.minElo
        : normalizedElo >= tier.minElo && normalizedElo <= tier.maxElo)) !== null && _a !== void 0 ? _a : exports.RANK_TIERS[0]);
}
function getMatchmakingKFactor(kind) {
    return kind === "ranked" ? exports.RANKED_ELO_K_FACTOR : exports.CASUAL_MMR_K_FACTOR;
}
function getExpectedScore(rating, opponentRating) {
    return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}
function resolveHeadToHeadRatingDeltas(leftRating, rightRating, outcome, kFactor) {
    const expectedLeft = getExpectedScore(leftRating, rightRating);
    const actualLeft = outcome === "draw"
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
function applyRatingDelta(rating, delta) {
    return Math.max(0, Math.round(rating + delta));
}
