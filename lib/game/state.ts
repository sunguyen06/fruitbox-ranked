import { generateBoard } from "./board";
import { createMatchConfig, type MatchConfigOverrides } from "./config";
import {
  applyMove as applyGameMove,
  applyValidatedMove,
  createRectangleMove,
  validateSelectedCells,
} from "./move";
import type {
  FruitCell,
  GameEndReason,
  GameState,
  MatchConfig,
  SelectionRect,
} from "./types";

export function createGameState(config: MatchConfig, board = generateBoard(config)): GameState {
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

export function createNewGame(seed: string, overrides: MatchConfigOverrides = {}): GameState {
  return createGameState(createMatchConfig(seed, overrides));
}

export function tickGame(state: GameState, deltaMs: number): GameState {
  if (state.status === "ended") {
    return state;
  }

  const remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));

  if (remainingMs === 0) {
    return finishGame(
      {
        ...state,
        remainingMs,
      },
      "time-expired",
    );
  }

  return {
    ...state,
    remainingMs,
  };
}

export function applySelectionToGame(
  state: GameState,
  selectionRect: SelectionRect | null,
): GameState {
  if (!selectionRect) {
    return state;
  }

  return applyGameMove(
    state,
    createRectangleMove(selectionRect, getElapsedMatchMs(state)),
  );
}

export function applyResolvedSelectionToGame(
  state: GameState,
  selectedCells: FruitCell[],
  selectionRect: SelectionRect | null = null,
): GameState {
  const fallbackSelection = selectionRect ?? {
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
  };
  const move = createRectangleMove(fallbackSelection, getElapsedMatchMs(state));
  const validation = validateSelectedCells(state, selectedCells, move);

  return applyValidatedMove(state, validation);
}

export function finishGame(
  state: GameState,
  endReason: Exclude<GameEndReason, null>,
): GameState {
  if (state.status === "ended") {
    return state;
  }

  return {
    ...state,
    status: "ended",
    endReason,
    result: {
      seed: state.config.seed,
      finalScore: state.score,
      appliedMoveCount: state.appliedMoveCount,
      remainingMs: state.remainingMs,
      status: "ended",
      endReason,
    },
  };
}

export function isGameOver(state: GameState): boolean {
  return state.status === "ended";
}

export function getElapsedMatchMs(state: GameState): number {
  return state.config.durationMs - state.remainingMs;
}
