import test from "node:test";
import assert from "node:assert/strict";

import {
  applySelectionBoxToGame,
  applySelectionToGame,
  createGameState,
  createMatchConfig,
  generateBoard,
  getSelectionPreview,
  resolveSelectionBoxToCells,
  synchronizeGameClock,
  tickGame,
  type Board,
} from "../lib/game";

test("same seed produces the same board", () => {
  const config = createMatchConfig("shared-seed");

  const firstBoard = generateBoard(config);
  const secondBoard = generateBoard(config);

  assert.deepEqual(secondBoard, firstBoard);
});

test("different seeds produce different boards", () => {
  const firstBoard = generateBoard(createMatchConfig("seed-one"));
  const secondBoard = generateBoard(createMatchConfig("seed-two"));

  assert.notDeepEqual(secondBoard, firstBoard);
});

test("valid selection with sum 10 removes fruits correctly", () => {
  const config = createMatchConfig("valid-move", { rows: 2, cols: 2 });
  const board = createBoard([
    [4, 6],
    [3, 1],
  ]);
  const initialState = createGameState(config, board);

  const nextState = applySelectionToGame(initialState, {
    start: { row: 0, col: 0 },
    end: { row: 0, col: 1 },
  });

  assert.equal(nextState.score, 2);
  assert.equal(nextState.appliedMoveCount, 1);
  assert.equal(nextState.lastMove?.isValid, true);
  assert.equal(nextState.board[0][0], null);
  assert.equal(nextState.board[0][1], null);
  assert.notEqual(nextState.board[1][0], null);
  assert.notEqual(nextState.board[1][1], null);
});

test("invalid selection does nothing", () => {
  const config = createMatchConfig("invalid-move", { rows: 2, cols: 2 });
  const board = createBoard([
    [4, 6],
    [3, 1],
  ]);
  const initialState = createGameState(config, board);

  const nextState = applySelectionToGame(initialState, {
    start: { row: 0, col: 0 },
    end: { row: 1, col: 0 },
  });

  assert.deepEqual(nextState.board, initialState.board);
  assert.equal(nextState.score, 0);
  assert.equal(nextState.appliedMoveCount, 0);
  assert.equal(nextState.lastMove?.isValid, false);
  assert.equal(nextState.lastMove?.reason, "sum-mismatch");
});

test("score updates by the number of fruits removed", () => {
  const config = createMatchConfig("score-update", { rows: 1, cols: 3 });
  const board = createBoard([[2, 3, 5]]);
  const initialState = createGameState(config, board);

  const nextState = applySelectionToGame(initialState, {
    start: { row: 0, col: 0 },
    end: { row: 0, col: 2 },
  });

  assert.equal(nextState.score, 3);
  assert.equal(nextState.lastMove?.scoreDelta, 3);
});

test("game over prevents further moves", () => {
  const config = createMatchConfig("game-over", { rows: 1, cols: 2, durationMs: 500 });
  const board = createBoard([[4, 6]]);
  const initialState = createGameState(config, board);
  const endedState = tickGame(initialState, 500);

  const nextState = applySelectionToGame(endedState, {
    start: { row: 0, col: 0 },
    end: { row: 0, col: 1 },
  });

  assert.equal(endedState.status, "ended");
  assert.equal(endedState.result?.endReason, "time-expired");
  assert.deepEqual(nextState.board, endedState.board);
  assert.equal(nextState.score, endedState.score);
  assert.equal(nextState.lastMove?.isValid, false);
  assert.equal(nextState.lastMove?.reason, "game-over");
});

test("freeform selection only counts fruits whose centers are inside the box", () => {
  const board = createBoard([[3], [7]]);

  const topCenterOnly = resolveSelectionBoxToCells(
    board,
    {
      top: 0,
      left: 0,
      width: 1,
      height: 0.49,
    },
  );

  assert.deepEqual(
    topCenterOnly.map((cell) => cell.value),
    [3],
  );

  const bottomCenterOnly = resolveSelectionBoxToCells(
    board,
    {
      top: 0.51,
      left: 0,
      width: 1,
      height: 0.49,
    },
  );

  assert.deepEqual(
    bottomCenterOnly.map((cell) => cell.value),
    [7],
  );
});

test("selection preview and apply path share the same center-hit result", () => {
  const config = createMatchConfig("selection-box", { rows: 2, cols: 1 });
  const board = createBoard([[3], [7]]);
  const initialState = createGameState(config, board);
  const selectionBox = {
    top: 0.51,
    left: 0,
    width: 1,
    height: 0.49,
  };

  const preview = getSelectionPreview(initialState, selectionBox);
  const nextState = applySelectionBoxToGame(initialState, selectionBox);

  assert.deepEqual(preview?.selectedCellIds, ["cell-1-0"]);
  assert.equal(nextState.lastMove?.selectedCellIds[0], "cell-1-0");
  assert.equal(nextState.lastMove?.selectedSum, 7);
});

test("synchronizeGameClock derives remaining time from total elapsed time", () => {
  const config = createMatchConfig("clock-sync", { durationMs: 90_000 });
  const initialState = createGameState(config);
  const alteredState = {
    ...initialState,
    remainingMs: 70_000,
  };

  const syncedState = synchronizeGameClock(alteredState, 15_000);

  assert.equal(syncedState.remainingMs, 75_000);
  assert.equal(syncedState.status, "active");
});

test("synchronizeGameClock ends the game when elapsed time reaches duration", () => {
  const config = createMatchConfig("clock-end", { durationMs: 1_000 });
  const initialState = createGameState(config);

  const syncedState = synchronizeGameClock(initialState, 1_250);

  assert.equal(syncedState.remainingMs, 0);
  assert.equal(syncedState.status, "ended");
  assert.equal(syncedState.result?.endReason, "time-expired");
});

function createBoard(rows: number[][]): Board {
  return rows.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      id: `cell-${rowIndex}-${colIndex}`,
      kind: "apple",
      value,
      row: rowIndex,
      col: colIndex,
    })),
  );
}
