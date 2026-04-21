import { FRUIT_KINDS } from "@/lib/game/constants";

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

export interface SelectionRect {
  start: GridPoint;
  end: GridPoint;
}

export interface NormalizedSelectionRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MoveResult {
  board: Board;
  selectedCells: FruitCell[];
  selectedCount: number;
  removedIds: string[];
  scoreDelta: number;
  sum: number;
  isValid: boolean;
}

export type GameStatus = "active" | "ended";

export interface GameState {
  seed: string;
  rows: number;
  cols: number;
  board: Board;
  score: number;
  remainingMs: number;
  status: GameStatus;
  lastMove: MoveResult | null;
}
