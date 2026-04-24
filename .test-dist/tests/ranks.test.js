"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const ranks_1 = require("../lib/ranks");
(0, node_test_1.default)("rank tiers use the requested elo thresholds", () => {
    strict_1.default.equal((0, ranks_1.getRankTier)(0).name, "Apple");
    strict_1.default.equal((0, ranks_1.getRankTier)(599).name, "Apple");
    strict_1.default.equal((0, ranks_1.getRankTier)(600).name, "Pear");
    strict_1.default.equal((0, ranks_1.getRankTier)(899).name, "Pear");
    strict_1.default.equal((0, ranks_1.getRankTier)(900).name, "Banana");
    strict_1.default.equal((0, ranks_1.getRankTier)(1199).name, "Banana");
    strict_1.default.equal((0, ranks_1.getRankTier)(1200).name, "Mango");
    strict_1.default.equal((0, ranks_1.getRankTier)(1599).name, "Mango");
    strict_1.default.equal((0, ranks_1.getRankTier)(1600).name, "Pineapple");
    strict_1.default.equal((0, ranks_1.getRankTier)(1999).name, "Pineapple");
    strict_1.default.equal((0, ranks_1.getRankTier)(2000).name, "Melon");
});
(0, node_test_1.default)("ranked elo gives bigger swings for upsets", () => {
    const expectedFavoriteWin = (0, ranks_1.resolveHeadToHeadRatingDeltas)(1200, 1000, "left-win", (0, ranks_1.getMatchmakingKFactor)("ranked"));
    const expectedUpset = (0, ranks_1.resolveHeadToHeadRatingDeltas)(1000, 1200, "left-win", (0, ranks_1.getMatchmakingKFactor)("ranked"));
    strict_1.default.equal(expectedFavoriteWin.leftDelta, 8);
    strict_1.default.equal(expectedFavoriteWin.rightDelta, -8);
    strict_1.default.equal(expectedUpset.leftDelta, 24);
    strict_1.default.equal(expectedUpset.rightDelta, -24);
});
(0, node_test_1.default)("casual mmr uses a smaller k-factor than ranked", () => {
    const ranked = (0, ranks_1.resolveHeadToHeadRatingDeltas)(1000, 1000, "left-win", (0, ranks_1.getMatchmakingKFactor)("ranked"));
    const casual = (0, ranks_1.resolveHeadToHeadRatingDeltas)(1000, 1000, "left-win", (0, ranks_1.getMatchmakingKFactor)("casual"));
    strict_1.default.equal(ranked.leftDelta, 16);
    strict_1.default.equal(casual.leftDelta, 12);
});
(0, node_test_1.default)("draws shift rating toward the stronger opponent's expectation", () => {
    const draw = (0, ranks_1.resolveHeadToHeadRatingDeltas)(1400, 1000, "draw", (0, ranks_1.getMatchmakingKFactor)("ranked"));
    strict_1.default.equal(draw.leftDelta, -13);
    strict_1.default.equal(draw.rightDelta, 13);
    strict_1.default.equal((0, ranks_1.applyRatingDelta)(1000, draw.rightDelta), 1013);
});
