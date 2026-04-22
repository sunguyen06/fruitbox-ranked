import {
  DEFAULT_BOARD_COLS,
  DEFAULT_BOARD_ROWS,
  DEFAULT_MATCH_DURATION_MS,
  DEFAULT_TARGET_SUM,
  FRUIT_KINDS,
  MAX_FRUIT_VALUE,
  MIN_FRUIT_VALUE,
} from "./constants";
import type { MatchConfig } from "./types";

export interface MatchConfigOverrides {
  cols?: number;
  rows?: number;
  durationMs?: number;
  targetSum?: number;
  fruitKinds?: MatchConfig["fruitKinds"];
  minFruitValue?: number;
  maxFruitValue?: number;
}

export function createMatchConfig(
  seed: string,
  overrides: MatchConfigOverrides = {},
): MatchConfig {
  return {
    seed,
    rows: overrides.rows ?? DEFAULT_BOARD_ROWS,
    cols: overrides.cols ?? DEFAULT_BOARD_COLS,
    durationMs: overrides.durationMs ?? DEFAULT_MATCH_DURATION_MS,
    targetSum: overrides.targetSum ?? DEFAULT_TARGET_SUM,
    fruitKinds: [...(overrides.fruitKinds ?? FRUIT_KINDS)],
    minFruitValue: overrides.minFruitValue ?? MIN_FRUIT_VALUE,
    maxFruitValue: overrides.maxFruitValue ?? MAX_FRUIT_VALUE,
  };
}
