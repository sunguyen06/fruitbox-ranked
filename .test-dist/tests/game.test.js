"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const game_1 = require("../lib/game");
(0, node_test_1.default)("same seed produces the same board", () => {
    const config = (0, game_1.createMatchConfig)("shared-seed");
    const firstBoard = (0, game_1.generateBoard)(config);
    const secondBoard = (0, game_1.generateBoard)(config);
    strict_1.default.deepEqual(secondBoard, firstBoard);
});
(0, node_test_1.default)("different seeds produce different boards", () => {
    const firstBoard = (0, game_1.generateBoard)((0, game_1.createMatchConfig)("seed-one"));
    const secondBoard = (0, game_1.generateBoard)((0, game_1.createMatchConfig)("seed-two"));
    strict_1.default.notDeepEqual(secondBoard, firstBoard);
});
(0, node_test_1.default)("valid selection with sum 10 removes fruits correctly", () => {
    var _a;
    const config = (0, game_1.createMatchConfig)("valid-move", { rows: 2, cols: 2 });
    const board = createBoard([
        [4, 6],
        [3, 1],
    ]);
    const initialState = (0, game_1.createGameState)(config, board);
    const nextState = (0, game_1.applySelectionToGame)(initialState, {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 1 },
    });
    strict_1.default.equal(nextState.score, 2);
    strict_1.default.equal(nextState.appliedMoveCount, 1);
    strict_1.default.equal((_a = nextState.lastMove) === null || _a === void 0 ? void 0 : _a.isValid, true);
    strict_1.default.equal(nextState.board[0][0], null);
    strict_1.default.equal(nextState.board[0][1], null);
    strict_1.default.notEqual(nextState.board[1][0], null);
    strict_1.default.notEqual(nextState.board[1][1], null);
});
(0, node_test_1.default)("invalid selection does nothing", () => {
    var _a, _b;
    const config = (0, game_1.createMatchConfig)("invalid-move", { rows: 2, cols: 2 });
    const board = createBoard([
        [4, 6],
        [3, 1],
    ]);
    const initialState = (0, game_1.createGameState)(config, board);
    const nextState = (0, game_1.applySelectionToGame)(initialState, {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 0 },
    });
    strict_1.default.deepEqual(nextState.board, initialState.board);
    strict_1.default.equal(nextState.score, 0);
    strict_1.default.equal(nextState.appliedMoveCount, 0);
    strict_1.default.equal((_a = nextState.lastMove) === null || _a === void 0 ? void 0 : _a.isValid, false);
    strict_1.default.equal((_b = nextState.lastMove) === null || _b === void 0 ? void 0 : _b.reason, "sum-mismatch");
});
(0, node_test_1.default)("score updates by the number of fruits removed", () => {
    var _a;
    const config = (0, game_1.createMatchConfig)("score-update", { rows: 1, cols: 3 });
    const board = createBoard([[2, 3, 5]]);
    const initialState = (0, game_1.createGameState)(config, board);
    const nextState = (0, game_1.applySelectionToGame)(initialState, {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 2 },
    });
    strict_1.default.equal(nextState.score, 3);
    strict_1.default.equal((_a = nextState.lastMove) === null || _a === void 0 ? void 0 : _a.scoreDelta, 3);
});
(0, node_test_1.default)("game over prevents further moves", () => {
    var _a, _b, _c;
    const config = (0, game_1.createMatchConfig)("game-over", { rows: 1, cols: 2, durationMs: 500 });
    const board = createBoard([[4, 6]]);
    const initialState = (0, game_1.createGameState)(config, board);
    const endedState = (0, game_1.tickGame)(initialState, 500);
    const nextState = (0, game_1.applySelectionToGame)(endedState, {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 1 },
    });
    strict_1.default.equal(endedState.status, "ended");
    strict_1.default.equal((_a = endedState.result) === null || _a === void 0 ? void 0 : _a.endReason, "time-expired");
    strict_1.default.deepEqual(nextState.board, endedState.board);
    strict_1.default.equal(nextState.score, endedState.score);
    strict_1.default.equal((_b = nextState.lastMove) === null || _b === void 0 ? void 0 : _b.isValid, false);
    strict_1.default.equal((_c = nextState.lastMove) === null || _c === void 0 ? void 0 : _c.reason, "game-over");
});
(0, node_test_1.default)("freeform selection only counts fruits whose centers are inside the box", () => {
    const board = createBoard([[3], [7]]);
    const topCenterOnly = (0, game_1.resolveSelectionBoxToCells)(board, {
        top: 0,
        left: 0,
        width: 1,
        height: 0.49,
    });
    strict_1.default.deepEqual(topCenterOnly.map((cell) => cell.value), [3]);
    const bottomCenterOnly = (0, game_1.resolveSelectionBoxToCells)(board, {
        top: 0.51,
        left: 0,
        width: 1,
        height: 0.49,
    });
    strict_1.default.deepEqual(bottomCenterOnly.map((cell) => cell.value), [7]);
});
function createBoard(rows) {
    return rows.map((row, rowIndex) => row.map((value, colIndex) => ({
        id: `cell-${rowIndex}-${colIndex}`,
        kind: "apple",
        value,
        row: rowIndex,
        col: colIndex,
    })));
}
