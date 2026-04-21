"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import type { PointerEvent } from "react";

import { GameBoard } from "@/components/game/game-board";
import { GameHud } from "@/components/game/game-hud";
import { GameOverPanel } from "@/components/game/game-over-panel";
import { TARGET_SUM, TIMER_TICK_MS } from "@/lib/game/constants";
import { createSessionSeed } from "@/lib/game/rng";
import {
  getSelectedCells,
  normalizeSelectionRect,
  sumSelectedCells,
} from "@/lib/game/selection";
import { applySelectionToGame, createNewGame, tickGame } from "@/lib/game/state";
import type { GameState, GridPoint, SelectionRect } from "@/lib/game/types";

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

  // Compute grid selection for cell highlighting
  const previewSelection: SelectionRect | null = dragSelection
    ? getGridSelectionFromPixels(dragSelection, gameState.rows, gameState.cols)
    : null;
  const previewCells = getSelectedCells(gameState.board, previewSelection);
  const previewSelectedIds = new Set(previewCells.map((cell) => cell.id));
  const previewSum = sumSelectedCells(previewCells);
  const selectionState =
    previewCells.length === 0 ? "idle" : previewSum === TARGET_SUM ? "valid" : "invalid";

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
    url.searchParams.set("seed", gameState.seed);
    window.history.replaceState({}, "", url);
  }, [gameState.seed]);

  function restartWithSeed(seed: string) {
    setDragSelection(null);
    startTransition(() => {
      setGameState(createNewGame(seed));
    });
  }

  function handleRestart() {
    restartWithSeed(gameState.seed);
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
    setDragSelection({ startX: relativeX, startY: relativeY, currentX: relativeX, currentY: relativeY });
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

    const finishedSelection = getGridSelectionFromPixels(
      { startX: dragSelection.startX, startY: dragSelection.startY, currentX: relativeX, currentY: relativeY },
      gameState.rows,
      gameState.cols,
    );

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
    if (finishedSelection) {
      startTransition(() => {
        setGameState((currentState) => applySelectionToGame(currentState, finishedSelection));
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
            seed={gameState.seed}
            onRestart={handleRestart}
            onNewSeed={handleNewSeed}
          />

          <section className="flex flex-col items-center gap-4">
            <div className="relative w-full">
              <GameBoard
                board={gameState.board}
                rows={gameState.rows}
                cols={gameState.cols}
                selectedCellIds={previewSelectedIds}
                selectionRect={null}
                visualSelectionRect={visualSelectionRect}
                selectionState={previewSum === TARGET_SUM ? "valid" : "invalid"}
                isInteractive={gameState.status === "active"}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              />

              {gameState.status === "ended" ? (
                <GameOverPanel
                  score={gameState.score}
                  seed={gameState.seed}
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

function resolveGridPoint(
  event: PointerEvent<HTMLDivElement>,
  rows: number,
  cols: number,
): GridPoint | null {
  const bounds = event.currentTarget.getBoundingClientRect();

  if (bounds.width === 0 || bounds.height === 0) {
    return null;
  }

  const relativeX = (event.clientX - bounds.left) / bounds.width;
  const relativeY = (event.clientY - bounds.top) / bounds.height;

  return {
    row: clampIndex(Math.floor(relativeY * rows), rows),
    col: clampIndex(Math.floor(relativeX * cols), cols),
  };
}

function getGridSelectionFromPixels(
  pixelSelection: DragSelection,
  rows: number,
  cols: number,
): SelectionRect | null {
  const startCol = clampIndex(Math.floor(pixelSelection.startX * cols), cols);
  const startRow = clampIndex(Math.floor(pixelSelection.startY * rows), rows);
  const endCol = clampIndex(Math.floor(pixelSelection.currentX * cols), cols);
  const endRow = clampIndex(Math.floor(pixelSelection.currentY * rows), rows);

  return {
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol },
  };
}

function clampIndex(value: number, maxExclusive: number): number {
  return Math.min(maxExclusive - 1, Math.max(0, value));
}
