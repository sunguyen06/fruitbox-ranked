import { createSeededRng, pickOne, randomInt } from "./rng";
import type { Board, FruitCell, MatchConfig } from "./types";

export function generateBoard(config: MatchConfig): Board {
  const rng = createSeededRng(`${config.seed}:${config.rows}x${config.cols}`);

  return Array.from({ length: config.rows }, (_, row) =>
    Array.from({ length: config.cols }, (_, col) => createFruitCell(rng, config, row, col)),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function createFruitCell(
  rng: () => number,
  config: MatchConfig,
  row: number,
  col: number,
): FruitCell {
  return {
    id: `${config.seed}-${row}-${col}-${Math.floor(rng() * 1_000_000_000).toString(36)}`,
    kind: pickOne(rng, config.fruitKinds),
    value: randomInt(rng, config.minFruitValue, config.maxFruitValue),
    row,
    col,
  };
}
