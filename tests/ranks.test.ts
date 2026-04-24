import test from "node:test";
import assert from "node:assert/strict";

import {
  applyRatingDelta,
  getMatchmakingKFactor,
  getRankTier,
  resolveHeadToHeadRatingDeltas,
} from "../lib/ranks";

test("rank tiers use the requested elo thresholds", () => {
  assert.equal(getRankTier(0).name, "Apple");
  assert.equal(getRankTier(599).name, "Apple");
  assert.equal(getRankTier(600).name, "Pear");
  assert.equal(getRankTier(899).name, "Pear");
  assert.equal(getRankTier(900).name, "Banana");
  assert.equal(getRankTier(1199).name, "Banana");
  assert.equal(getRankTier(1200).name, "Mango");
  assert.equal(getRankTier(1599).name, "Mango");
  assert.equal(getRankTier(1600).name, "Pineapple");
  assert.equal(getRankTier(1999).name, "Pineapple");
  assert.equal(getRankTier(2000).name, "Melon");
});

test("ranked elo gives bigger swings for upsets", () => {
  const expectedFavoriteWin = resolveHeadToHeadRatingDeltas(
    1200,
    1000,
    "left-win",
    getMatchmakingKFactor("ranked"),
  );
  const expectedUpset = resolveHeadToHeadRatingDeltas(
    1000,
    1200,
    "left-win",
    getMatchmakingKFactor("ranked"),
  );

  assert.equal(expectedFavoriteWin.leftDelta, 8);
  assert.equal(expectedFavoriteWin.rightDelta, -8);
  assert.equal(expectedUpset.leftDelta, 24);
  assert.equal(expectedUpset.rightDelta, -24);
});

test("casual mmr uses a smaller k-factor than ranked", () => {
  const ranked = resolveHeadToHeadRatingDeltas(
    1000,
    1000,
    "left-win",
    getMatchmakingKFactor("ranked"),
  );
  const casual = resolveHeadToHeadRatingDeltas(
    1000,
    1000,
    "left-win",
    getMatchmakingKFactor("casual"),
  );

  assert.equal(ranked.leftDelta, 16);
  assert.equal(casual.leftDelta, 12);
});

test("draws shift rating toward the stronger opponent's expectation", () => {
  const draw = resolveHeadToHeadRatingDeltas(
    1400,
    1000,
    "draw",
    getMatchmakingKFactor("ranked"),
  );

  assert.equal(draw.leftDelta, -13);
  assert.equal(draw.rightDelta, 13);
  assert.equal(applyRatingDelta(1000, draw.rightDelta), 1013);
});
