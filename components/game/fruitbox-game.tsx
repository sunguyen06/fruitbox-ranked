"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import type { PointerEvent } from "react";

import { GameBoard } from "@/components/game/game-board";
import { GameHud } from "@/components/game/game-hud";
import { GameOverPanel } from "@/components/game/game-over-panel";
import {
  TIMER_TICK_MS,
  applyResolvedSelectionToGame,
  type GameState,
  type NormalizedSelectionBox,
  createNewGame,
  createSessionSeed,
  resolveSelectionBoxToCells,
  sumSelectedCells,
  tickGame,
} from "@/lib/game";

interface FruitboxGameProps {
  initialSeed: string;
}

interface DragSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function FruitboxGame({ initialSeed }: FruitboxGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => createNewGame(initialSeed));
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);

  // Compute visual selection box directly from pixel coords without grid snapping
  const visualSelectionRect = dragSelection
    ? {
        top: Math.min(dragSelection.startY, dragSelection.currentY),
        left: Math.min(dragSelection.startX, dragSelection.currentX),
        width: Math.abs(dragSelection.currentX - dragSelection.startX),
        height: Math.abs(dragSelection.currentY - dragSelection.startY),
      }
    : null;

  const previewSelectionBox: NormalizedSelectionBox | null = visualSelectionRect;
  const previewCells = resolveSelectionBoxToCells(gameState.board, previewSelectionBox);
  const previewSelectedIds = new Set(previewCells.map((cell) => cell.id));
  const previewSum = sumSelectedCells(previewCells);
  const selectionState =
    previewCells.length === 0 ? "idle" : previewSum === gameState.config.targetSum ? "valid" : "invalid";

  const advanceTimer = useEffectEvent(() => {
    setGameState((currentState) => tickGame(currentState, TIMER_TICK_MS));
  });

  useEffect(() => {
    if (gameState.status === "ended") {
      return;
    }

    const intervalId = window.setInterval(() => {
      advanceTimer();
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gameState.status]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", gameState.config.seed);
    window.history.replaceState({}, "", url);
  }, [gameState.config.seed]);

  function restartWithSeed(seed: string) {
    setDragSelection(null);
    startTransition(() => {
      setGameState(createNewGame(seed));
    });
  }

  function handleRestart() {
    restartWithSeed(gameState.config.seed);
  }

  function handleNewSeed() {
    restartWithSeed(createSessionSeed());
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (gameState.status === "ended") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }

    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const relativeY = (event.clientY - bounds.top) / bounds.height;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragSelection({
      startX: relativeX,
      startY: relativeY,
      currentX: relativeX,
      currentY: relativeY,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragSelection || gameState.status === "ended") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }

    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const relativeY = (event.clientY - bounds.top) / bounds.height;

    setDragSelection((currentSelection) => {
      if (!currentSelection) {
        return currentSelection;
      }

      return {
        ...currentSelection,
        currentX: relativeX,
        currentY: relativeY,
      };
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragSelection) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = bounds.width === 0 ? dragSelection.currentX : (event.clientX - bounds.left) / bounds.width;
    const relativeY = bounds.height === 0 ? dragSelection.currentY : (event.clientY - bounds.top) / bounds.height;

    const finishedSelectionBox = {
      top: Math.min(dragSelection.startY, relativeY),
      left: Math.min(dragSelection.startX, relativeX),
      width: Math.abs(relativeX - dragSelection.startX),
      height: Math.abs(relativeY - dragSelection.startY),
    };
    const finishedSelection = getGridSelectionFromPixels(
      {
        startX: dragSelection.startX,
        startY: dragSelection.startY,
        currentX: relativeX,
        currentY: relativeY,
      },
      gameState.config.rows,
      gameState.config.cols,
    );
    const selectedCells = resolveSelectionBoxToCells(
      gameState.board,
      finishedSelectionBox,
    );

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
    if (finishedSelection) {
      startTransition(() => {
        setGameState((currentState) =>
          applyResolvedSelectionToGame(currentState, selectedCells, finishedSelection),
        );
      });
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-gray-100">
      <div className="relative w-full max-w-[1152px] overflow-hidden rounded-lg bg-white p-6 shadow-lg">
        <div className="relative flex flex-col gap-4">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-stone-800">Fruitbox</h1>
          </header>

          <GameHud
            score={gameState.score}
            remainingMs={gameState.remainingMs}
            seed={gameState.config.seed}
            onRestart={handleRestart}
            onNewSeed={handleNewSeed}
          />

          <section className="flex flex-col items-center gap-4">
            <div className="relative w-full">
              <GameBoard
                board={gameState.board}
                rows={gameState.config.rows}
                cols={gameState.config.cols}
                selectedCellIds={previewSelectedIds}
                visualSelectionRect={visualSelectionRect}
                selectionState={selectionState}
                isInteractive={gameState.status === "active"}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              />

              {gameState.status === "ended" ? (
                <GameOverPanel
                  score={gameState.score}
                  seed={gameState.config.seed}
                  onRestart={handleRestart}
                  onNewSeed={handleNewSeed}
                />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function getGridSelectionFromPixels(
  pixelSelection: DragSelection,
  rows: number,
  cols: number,
): {
  start: { row: number; col: number };
  end: { row: number; col: number };
} | null {
  const left = Math.min(pixelSelection.startX, pixelSelection.currentX);
  const right = Math.max(pixelSelection.startX, pixelSelection.currentX);
  const top = Math.min(pixelSelection.startY, pixelSelection.currentY);
  const bottom = Math.max(pixelSelection.startY, pixelSelection.currentY);

  const startCol = clampIndex(Math.floor(left * cols), cols);
  const startRow = clampIndex(Math.floor(top * rows), rows);
  const endCol = clampIndex(Math.ceil(right * cols) - 1, cols);
  const endRow = clampIndex(Math.ceil(bottom * rows) - 1, rows);

  return {
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol },
  };
}

function clampIndex(value: number, maxExclusive: number): number {
  return Math.min(maxExclusive - 1, Math.max(0, value));
}
