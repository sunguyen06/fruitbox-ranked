import {
  BOARD_COLS,
  BOARD_ROWS,
  MATCH_DURATION_MS,
  TARGET_SUM,
} from "@/lib/game/constants";
import { cloneBoard, generateBoard } from "@/lib/game/board";
import { getSelectedCells, sumSelectedCells } from "@/lib/game/selection";
import type { Board, FruitCell, GameState, MoveResult, SelectionRect } from "@/lib/game/types";

export function applyMove(board: Board, selectedCells: FruitCell[]): MoveResult {
  const sum = sumSelectedCells(selectedCells);
  const isValid = selectedCells.length > 0 && sum === TARGET_SUM;

  if (!isValid) {
    return {
      board,
      selectedCells,
      selectedCount: selectedCells.length,
      removedIds: [],
      scoreDelta: 0,
      sum,
      isValid: false,
    };
  }

  const nextBoard = cloneBoard(board);

  for (const cell of selectedCells) {
    nextBoard[cell.row][cell.col] = null;
  }

  return {
    board: nextBoard,
    selectedCells,
    selectedCount: selectedCells.length,
    removedIds: selectedCells.map((cell) => cell.id),
    scoreDelta: selectedCells.length,
    sum,
    isValid: true,
  };
}

export function createNewGame(
  seed: string,
  rows = BOARD_ROWS,
  cols = BOARD_COLS,
): GameState {
  return {
    seed,
    rows,
    cols,
    board: generateBoard(seed, rows, cols),
    score: 0,
    remainingMs: MATCH_DURATION_MS,
    status: "active",
    lastMove: null,
  };
}

export function tickGame(state: GameState, deltaMs: number): GameState {
  if (state.status === "ended") {
    return state;
  }

  const remainingMs = Math.max(0, state.remainingMs - deltaMs);

  return {
    ...state,
    remainingMs,
    status: remainingMs === 0 ? "ended" : state.status,
  };
}

export function applySelectionToGame(
  state: GameState,
  selectionRect: SelectionRect | null,
): GameState {
  if (state.status === "ended" || !selectionRect) {
    return state;
  }

  const selectedCells = getSelectedCells(state.board, selectionRect);
  const move = applyMove(state.board, selectedCells);

  return {
    ...state,
    board: move.board,
    score: state.score + move.scoreDelta,
    lastMove: move,
  };
}
