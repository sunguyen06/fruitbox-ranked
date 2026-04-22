"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRectangleMove = createRectangleMove;
exports.validateMove = validateMove;
exports.applyMove = applyMove;
exports.applyValidatedMove = applyValidatedMove;
exports.validateSelectedCells = validateSelectedCells;
const board_1 = require("./board");
const selection_1 = require("./selection");
function createRectangleMove(selection, issuedAtMs = 0) {
    return {
        type: "select-rectangle",
        selection,
        issuedAtMs,
    };
}
function validateMove(state, move) {
    const selection = (0, selection_1.clampSelectionRectangle)(move.selection, state.config.rows, state.config.cols);
    const selectedCells = (0, selection_1.resolveSelectionToCells)(state.board, selection);
    return validateSelectedCells(state, selectedCells, Object.assign(Object.assign({}, move), { selection }));
}
function applyMove(state, move) {
    const validation = validateMove(state, move);
    if (!validation.isValid) {
        return Object.assign(Object.assign({}, state), { lastMove: validation });
    }
    return applyValidatedMove(state, validation);
}
function applyValidatedMove(state, validation) {
    if (!validation.isValid) {
        return Object.assign(Object.assign({}, state), { lastMove: validation });
    }
    const board = removeCellsFromBoard(state.board, validation.selectedCells);
    return Object.assign(Object.assign({}, state), { board, score: state.score + validation.scoreDelta, appliedMoveCount: state.appliedMoveCount + 1, lastMove: validation });
}
function validateSelectedCells(state, selectedCells, move = createRectangleMove({
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
})) {
    const normalizedSelection = (0, selection_1.normalizeSelectionRectangle)(move.selection);
    const selectedSum = (0, selection_1.sumSelectedCells)(selectedCells);
    const selectedCellIds = selectedCells.map((cell) => cell.id);
    const selectedCount = selectedCells.length;
    const scoreDelta = selectedCount;
    if (state.status === "ended") {
        return {
            move,
            normalizedSelection,
            isValid: false,
            reason: "game-over",
            selectedCells,
            selectedCellIds,
            selectedCount,
            selectedSum,
            targetSum: state.config.targetSum,
            scoreDelta: 0,
            removedIds: [],
        };
    }
    if (selectedCount === 0) {
        return {
            move,
            normalizedSelection,
            isValid: false,
            reason: "empty-selection",
            selectedCells,
            selectedCellIds,
            selectedCount,
            selectedSum,
            targetSum: state.config.targetSum,
            scoreDelta: 0,
            removedIds: [],
        };
    }
    const isValid = selectedSum === state.config.targetSum;
    return {
        move,
        normalizedSelection,
        isValid,
        reason: isValid ? null : "sum-mismatch",
        selectedCells,
        selectedCellIds,
        selectedCount,
        selectedSum,
        targetSum: state.config.targetSum,
        scoreDelta: isValid ? scoreDelta : 0,
        removedIds: isValid ? selectedCellIds : [],
    };
}
function removeCellsFromBoard(board, selectedCells) {
    const nextBoard = (0, board_1.cloneBoard)(board);
    for (const cell of selectedCells) {
        nextBoard[cell.row][cell.col] = null;
    }
    return nextBoard;
}
