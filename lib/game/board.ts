import {
  BOARD_COLS,
  BOARD_ROWS,
  FRUIT_KINDS,
  MAX_FRUIT_VALUE,
} from "@/lib/game/constants";
import { pickOne, randomInt, createSeededRng } from "@/lib/game/rng";
import type { Board, FruitCell } from "@/lib/game/types";

export function generateBoard(
  seed: string,
  rows = BOARD_ROWS,
  cols = BOARD_COLS,
): Board {
  const rng = createSeededRng(`${seed}:${rows}x${cols}`);

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => createFruitCell(rng, seed, row, col)),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function createFruitCell(
  rng: () => number,
  seed: string,
  row: number,
  col: number,
): FruitCell {
  return {
    id: `${seed}-${row}-${col}-${Math.floor(rng() * 1_000_000_000).toString(36)}`,
    kind: pickOne(rng, FRUIT_KINDS),
    value: randomInt(rng, 1, MAX_FRUIT_VALUE),
    row,
    col,
  };
}
