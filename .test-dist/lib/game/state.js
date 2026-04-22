"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGameState = createGameState;
exports.createNewGame = createNewGame;
exports.tickGame = tickGame;
exports.synchronizeGameClock = synchronizeGameClock;
exports.applySelectionToGame = applySelectionToGame;
exports.applyResolvedSelectionToGame = applyResolvedSelectionToGame;
exports.getSelectionPreview = getSelectionPreview;
exports.applySelectionBoxToGame = applySelectionBoxToGame;
exports.finishGame = finishGame;
exports.isGameOver = isGameOver;
exports.getElapsedMatchMs = getElapsedMatchMs;
const board_1 = require("./board");
const config_1 = require("./config");
const move_1 = require("./move");
const selection_1 = require("./selection");
function createGameState(config, board = (0, board_1.generateBoard)(config)) {
    return {
        config,
        board,
        score: 0,
        remainingMs: config.durationMs,
        status: "active",
        endReason: null,
        appliedMoveCount: 0,
        lastMove: null,
        result: null,
    };
}
function createNewGame(seed, overrides = {}) {
    return createGameState((0, config_1.createMatchConfig)(seed, overrides));
}
function tickGame(state, deltaMs) {
    if (state.status === "ended") {
        return state;
    }
    const remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));
    if (remainingMs === 0) {
        return finishGame(Object.assign(Object.assign({}, state), { remainingMs }), "time-expired");
    }
    return Object.assign(Object.assign({}, state), { remainingMs });
}
function synchronizeGameClock(state, elapsedMs) {
    if (state.endReason === "manual-stop") {
        return state;
    }
    const remainingMs = Math.max(0, state.config.durationMs - Math.max(0, elapsedMs));
    if (remainingMs === 0) {
        return finishGame(Object.assign(Object.assign({}, state), { remainingMs }), "time-expired");
    }
    return Object.assign(Object.assign({}, state), { remainingMs });
}
function applySelectionToGame(state, selectionRect) {
    if (!selectionRect) {
        return state;
    }
    return (0, move_1.applyMove)(state, (0, move_1.createRectangleMove)(selectionRect, getElapsedMatchMs(state)));
}
function applyResolvedSelectionToGame(state, selectedCells, selectionRect = null) {
    const fallbackSelection = selectionRect !== null && selectionRect !== void 0 ? selectionRect : {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 0 },
    };
    const move = (0, move_1.createRectangleMove)(fallbackSelection, getElapsedMatchMs(state));
    const validation = (0, move_1.validateSelectedCells)(state, selectedCells, move);
    return (0, move_1.applyValidatedMove)(state, validation);
}
function getSelectionPreview(state, selectionBox) {
    return (0, selection_1.createSelectionPreview)(state.board, selectionBox);
}
function applySelectionBoxToGame(state, selectionBox) {
    const preview = getSelectionPreview(state, selectionBox);
    if (!preview) {
        return state;
    }
    return applyResolvedSelectionToGame(state, preview.selectedCells, preview.selectionRect);
}
function finishGame(state, endReason) {
    if (state.status === "ended") {
        return state;
    }
    return Object.assign(Object.assign({}, state), { status: "ended", endReason, result: {
            seed: state.config.seed,
            finalScore: state.score,
            appliedMoveCount: state.appliedMoveCount,
            remainingMs: state.remainingMs,
            status: "ended",
            endReason,
        } });
}
function isGameOver(state) {
    return state.status === "ended";
}
function getElapsedMatchMs(state) {
    return state.config.durationMs - state.remainingMs;
}
