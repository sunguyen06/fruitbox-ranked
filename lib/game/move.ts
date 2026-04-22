import { cloneBoard } from "./board";
import {
  clampSelectionRectangle,
  normalizeSelectionRectangle,
  resolveSelectionToCells,
  sumSelectedCells,
} from "./selection";
import type {
  Board,
  FruitCell,
  GameMove,
  GameState,
  MoveValidationResult,
} from "./types";

export function createRectangleMove(
  selection: GameMove["selection"],
  issuedAtMs = 0,
): GameMove {
  return {
    type: "select-rectangle",
    selection,
    issuedAtMs,
  };
}

export function validateMove(state: GameState, move: GameMove): MoveValidationResult {
  const selection = clampSelectionRectangle(
    move.selection,
    state.config.rows,
    state.config.cols,
  );
  const selectedCells = resolveSelectionToCells(state.board, selection);
  return validateSelectedCells(state, selectedCells, {
    ...move,
    selection,
  });
}

export function applyMove(state: GameState, move: GameMove): GameState {
  const validation = validateMove(state, move);

  if (!validation.isValid) {
    return {
      ...state,
      lastMove: validation,
    };
  }

  return applyValidatedMove(state, validation);
}

export function applyValidatedMove(
  state: GameState,
  validation: MoveValidationResult,
): GameState {
  if (!validation.isValid) {
    return {
      ...state,
      lastMove: validation,
    };
  }

  const board = removeCellsFromBoard(state.board, validation.selectedCells);

  return {
    ...state,
    board,
    score: state.score + validation.scoreDelta,
    appliedMoveCount: state.appliedMoveCount + 1,
    lastMove: validation,
  };
}

export function validateSelectedCells(
  state: GameState,
  selectedCells: FruitCell[],
  move = createRectangleMove({
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
  }),
): MoveValidationResult {
  const normalizedSelection = normalizeSelectionRectangle(move.selection);
  const selectedSum = sumSelectedCells(selectedCells);
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

function removeCellsFromBoard(board: Board, selectedCells: FruitCell[]): Board {
  const nextBoard = cloneBoard(board);

  for (const cell of selectedCells) {
    nextBoard[cell.row][cell.col] = null;
  }

  return nextBoard;
}
