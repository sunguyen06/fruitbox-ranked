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
