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
  start: GridPoint;
  current: GridPoint;
}

export function FruitboxGame({ initialSeed }: FruitboxGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => createNewGame(initialSeed));
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);

  const previewSelection: SelectionRect | null = dragSelection
    ? {
        start: dragSelection.start,
        end: dragSelection.current,
      }
    : null;
  const previewCells = getSelectedCells(gameState.board, previewSelection);
  const previewSum = sumSelectedCells(previewCells);
  const previewRect = previewSelection ? normalizeSelectionRect(previewSelection) : null;
  const previewSelectedIds = new Set(previewCells.map((cell) => cell.id));
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

    const point = resolveGridPoint(event, gameState.rows, gameState.cols);

    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragSelection({ start: point, current: point });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragSelection || gameState.status === "ended") {
      return;
    }

    const point = resolveGridPoint(event, gameState.rows, gameState.cols);

    if (!point) {
      return;
    }

    setDragSelection((currentSelection) => {
      if (!currentSelection) {
        return currentSelection;
      }

      if (
        currentSelection.current.row === point.row &&
        currentSelection.current.col === point.col
      ) {
        return currentSelection;
      }

      return {
        ...currentSelection,
        current: point,
      };
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragSelection) {
      return;
    }

    const endPoint = resolveGridPoint(event, gameState.rows, gameState.cols) ?? dragSelection.current;
    const finishedSelection: SelectionRect = {
      start: dragSelection.start,
      end: endPoint,
    };

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
    startTransition(() => {
      setGameState((currentState) => applySelectionToGame(currentState, finishedSelection));
    });
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-[1280px] overflow-hidden rounded-[2rem] border border-white/55 bg-[linear-gradient(180deg,rgba(255,251,243,0.97)_0%,rgba(255,242,224,0.94)_100%)] p-4 shadow-[0_24px_90px_rgba(74,44,27,0.14)] backdrop-blur xl:p-6">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,181,71,0.22),transparent_62%)]" />

        <div className="relative flex flex-col gap-6">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#1d6f42]">
              Fruitbox Ranked
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                  Prototype the core puzzle loop first.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  Drag a rectangle over the fruit grid. If the selected values total exactly{" "}
                  <span className="font-mono font-semibold text-stone-900">{TARGET_SUM}</span>, you
                  score one point per fruit removed.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/60 bg-white/70 px-4 py-3 text-sm text-stone-600 shadow-[0_12px_36px_rgba(64,37,23,0.08)]">
                Removed fruit stay gone in this MVP so board state stays deterministic, easy to
                validate, and ready for later server-authoritative multiplayer.
              </div>
            </div>
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
                selectionRect={previewRect}
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
                  seed={gameState.seed}
                  onRestart={handleRestart}
                  onNewSeed={handleNewSeed}
                />
              ) : null}
            </div>

            <div className="grid w-full gap-3 lg:grid-cols-[1.4fr_1fr]">
              <StatusPanel
                title="Selection Preview"
                tone={
                  selectionState === "valid"
                    ? "text-emerald-700"
                    : selectionState === "invalid"
                      ? "text-rose-700"
                      : "text-stone-700"
                }
                body={getSelectionCopy(previewCells.length, previewSum, selectionState)}
              />
              <StatusPanel
                title="Last Move"
                tone={gameState.lastMove?.isValid ? "text-emerald-700" : "text-stone-700"}
                body={getLastMoveCopy(gameState)}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusPanel({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_12px_36px_rgba(64,37,23,0.08)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
        {title}
      </p>
      <p className={`mt-3 text-sm leading-7 ${tone}`}>{body}</p>
    </div>
  );
}

function getSelectionCopy(
  selectedCount: number,
  previewSum: number,
  selectionState: "idle" | "valid" | "invalid",
): string {
  if (selectedCount === 0 || selectionState === "idle") {
    return "Drag across the board to frame a rectangle. The preview updates live as you grow or shrink the box.";
  }

  if (selectionState === "valid") {
    return `${selectedCount} fruit selected. Sum ${previewSum} hits the target exactly, so releasing now will score ${selectedCount}.`;
  }

  const difference = TARGET_SUM - previewSum;
  const direction = difference > 0 ? "below" : "above";

  return `${selectedCount} fruit selected. Sum ${previewSum} is ${Math.abs(difference)} ${direction} the target, so this box will not clear.`;
}

function getLastMoveCopy(gameState: GameState): string {
  if (!gameState.lastMove) {
    return "No moves yet. Early server-authoritative multiplayer can use this same pure move result shape to validate clients.";
  }

  if (gameState.lastMove.isValid) {
    return `Cleared ${gameState.lastMove.selectedCount} fruit for ${gameState.lastMove.scoreDelta} points with a perfect sum of ${gameState.lastMove.sum}.`;
  }

  if (gameState.lastMove.selectedCount === 0) {
    return "That rectangle only covered empty spaces, so the board stayed unchanged.";
  }

  return `That box summed to ${gameState.lastMove.sum}, so nothing was removed. Only exact ${TARGET_SUM}s score.`;
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

function clampIndex(value: number, maxExclusive: number): number {
  return Math.min(maxExclusive - 1, Math.max(0, value));
}
