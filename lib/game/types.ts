import { FRUIT_KINDS } from "./constants";

export type FruitKind = (typeof FRUIT_KINDS)[number];

export interface FruitCell {
  id: string;
  kind: FruitKind;
  value: number;
  row: number;
  col: number;
}

export type BoardCell = FruitCell | null;
export type Board = BoardCell[][];

export interface GridPoint {
  row: number;
  col: number;
}

export interface SelectionRectangle {
  start: GridPoint;
  end: GridPoint;
}

export interface NormalizedSelectionRectangle {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface NormalizedSelectionBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GameMove {
  type: "select-rectangle";
  selection: SelectionRectangle;
  issuedAtMs: number;
}

export type MoveInvalidReason = "game-over" | "empty-selection" | "sum-mismatch";

export interface MoveValidationResult {
  move: GameMove;
  normalizedSelection: NormalizedSelectionRectangle;
  isValid: boolean;
  reason: MoveInvalidReason | null;
  selectedCells: FruitCell[];
  selectedCellIds: string[];
  selectedCount: number;
  selectedSum: number;
  targetSum: number;
  scoreDelta: number;
  removedIds: string[];
}

export type GameStatus = "active" | "ended";
export type GameEndReason = "time-expired" | "manual-stop" | null;

export interface MatchConfig {
  seed: string;
  rows: number;
  cols: number;
  durationMs: number;
  targetSum: number;
  fruitKinds: FruitKind[];
  minFruitValue: number;
  maxFruitValue: number;
}

export interface MatchResult {
  seed: string;
  finalScore: number;
  appliedMoveCount: number;
  remainingMs: number;
  status: "ended";
  endReason: Exclude<GameEndReason, null>;
}

export interface GameState {
  config: MatchConfig;
  board: Board;
  score: number;
  remainingMs: number;
  status: GameStatus;
  endReason: GameEndReason;
  appliedMoveCount: number;
  lastMove: MoveValidationResult | null;
  result: MatchResult | null;
}

export type SelectionRect = SelectionRectangle;
export type NormalizedSelectionRect = NormalizedSelectionRectangle;
