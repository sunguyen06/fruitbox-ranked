import test from "node:test";
import assert from "node:assert/strict";

import { getRankTier } from "../lib/ranks";

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
