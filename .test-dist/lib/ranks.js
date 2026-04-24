"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_TIERS = void 0;
exports.getRankTier = getRankTier;
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
