"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchConfig = createMatchConfig;
const constants_1 = require("./constants");
function createMatchConfig(seed, overrides = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        seed,
        rows: (_a = overrides.rows) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_BOARD_ROWS,
        cols: (_b = overrides.cols) !== null && _b !== void 0 ? _b : constants_1.DEFAULT_BOARD_COLS,
        durationMs: (_c = overrides.durationMs) !== null && _c !== void 0 ? _c : constants_1.DEFAULT_MATCH_DURATION_MS,
        targetSum: (_d = overrides.targetSum) !== null && _d !== void 0 ? _d : constants_1.DEFAULT_TARGET_SUM,
        fruitKinds: [...((_e = overrides.fruitKinds) !== null && _e !== void 0 ? _e : constants_1.FRUIT_KINDS)],
        minFruitValue: (_f = overrides.minFruitValue) !== null && _f !== void 0 ? _f : constants_1.MIN_FRUIT_VALUE,
        maxFruitValue: (_g = overrides.maxFruitValue) !== null && _g !== void 0 ? _g : constants_1.MAX_FRUIT_VALUE,
    };
}
