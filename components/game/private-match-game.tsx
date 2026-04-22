"use client";

import { useEffect, useMemo, useState } from "react";
import type { PointerEvent } from "react";

import { GameBoard } from "@/components/game/game-board";
import { MenuShell } from "@/components/menu/menu-shell";
import {
  getSelectionPreview,
  synchronizeGameClock,
  type GameState,
  type NormalizedSelectionBox,
} from "@/lib/game";
import type { RoomPlayerStateSnapshot, RoomSnapshot } from "@/lib/multiplayer";

interface PrivateMatchGameProps {
  room: RoomSnapshot;
  sessionId: string;
  serverTimeOffsetMs: number;
  statusMessage: string | null;
  onLeave: () => void;
  onSubmitSelectionBox: (selectionBox: NormalizedSelectionBox) => Promise<void>;
}

interface DragSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function PrivateMatchGame({
  room,
  sessionId,
  serverTimeOffsetMs,
  statusMessage,
  onLeave,
  onSubmitSelectionBox,
}: PrivateMatchGameProps) {
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [renderNow, setRenderNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRenderNow(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const authoritativeNow = renderNow + serverTimeOffsetMs;
  const myPlayer = room.playerStates.find((playerState) => playerState.sessionId === sessionId) ?? null;
  const opponentPlayer =
    room.playerStates.find((playerState) => playerState.sessionId !== sessionId) ?? null;
  const myGameState = getLiveGameState(myPlayer, room.startedAt, authoritativeNow);
  const opponentGameState = getLiveGameState(opponentPlayer, room.startedAt, authoritativeNow);

  const visualSelectionRect = dragSelection
    ? {
        top: Math.min(dragSelection.startY, dragSelection.currentY),
        left: Math.min(dragSelection.startX, dragSelection.currentX),
        width: Math.abs(dragSelection.currentX - dragSelection.startX),
        height: Math.abs(dragSelection.currentY - dragSelection.startY),
      }
    : null;
  const previewSelectionBox: NormalizedSelectionBox | null = visualSelectionRect;
  const preview = myGameState ? getSelectionPreview(myGameState, previewSelectionBox) : null;
  const previewSelectedIds = useMemo(
    () => new Set(preview?.selectedCellIds ?? []),
    [preview],
  );
  const selectionState =
    !preview || preview.selectedCount === 0
      ? "idle"
      : preview.selectedSum === myGameState?.config.targetSum
        ? "valid"
        : "invalid";
  const countdownRemainingMs =
    room.status === "countdown" && room.countdownEndsAt
      ? Math.max(0, Date.parse(room.countdownEndsAt) - authoritativeNow)
      : 0;
  const isInteractive =
    room.status === "active" &&
    !!myGameState &&
    myGameState.status === "active";
  const isMatchFinished =
    room.status === "finished" ||
    (!!myGameState && !!opponentGameState && myGameState.status === "ended" && opponentGameState.status === "ended");

  if (!myGameState) {
    return (
      <MenuShell connectionStatus="connected">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center text-white/80 backdrop-blur">
          Waiting for your match state to load.
        </div>
      </MenuShell>
    );
  }

  return (
    <MenuShell connectionStatus="connected">
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-[1180px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.92),rgba(30,21,15,0.94))] p-5 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <ScoreCard
                label="Your Score"
                value={myGameState.score.toString()}
                accent="text-[#ffb347]"
              />
              <ScoreCard
                label={opponentPlayer ? `${opponentPlayer.displayName} Score` : "Opponent Score"}
                value={(opponentGameState?.score ?? 0).toString()}
                accent="text-[#7fe0a0]"
              />
              <ScoreCard
                label="Time"
                value={formatTime(myGameState.remainingMs)}
                accent="text-[#fff0de]"
              />
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#f4dfca]">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
                  Room Code
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-[0.18em] text-white">
                  {room.roomCode}
                </p>
              </div>

              <button
                type="button"
                onClick={onLeave}
                className="rounded-[1.1rem] border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#fff0de] transition hover:bg-white/10"
              >
                Leave Match
              </button>
            </div>
          </div>

          {statusMessage ? (
            <div className="mb-4 rounded-[1.3rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
              {statusMessage}
            </div>
          ) : null}

          <div className="relative">
            <GameBoard
              board={myGameState.board}
              rows={myGameState.config.rows}
              cols={myGameState.config.cols}
              selectedCellIds={previewSelectedIds}
              visualSelectionRect={visualSelectionRect}
              selectionState={selectionState}
              isInteractive={isInteractive}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            />

            {countdownRemainingMs > 0 ? (
              <MatchOverlay
                title="Get Ready"
                subtitle={`Match starts in ${Math.max(1, Math.ceil(countdownRemainingMs / 1000))}`}
              />
            ) : null}

            {isMatchFinished ? (
              <MatchOverlay
                title={resolveMatchTitle(myGameState.score, opponentGameState?.score ?? 0)}
                subtitle={`Final score ${myGameState.score} - ${opponentGameState?.score ?? 0}`}
              />
            ) : null}
          </div>
        </div>
      </div>
    </MenuShell>
  );

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!isInteractive) {
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
    if (!dragSelection || !isInteractive) {
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
    const relativeX =
      bounds.width === 0 ? dragSelection.currentX : (event.clientX - bounds.left) / bounds.width;
    const relativeY =
      bounds.height === 0 ? dragSelection.currentY : (event.clientY - bounds.top) / bounds.height;

    const finishedSelectionBox = {
      top: Math.min(dragSelection.startY, relativeY),
      left: Math.min(dragSelection.startX, relativeX),
      width: Math.abs(relativeX - dragSelection.startX),
      height: Math.abs(relativeY - dragSelection.startY),
    };

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);

    if (finishedSelectionBox.width > 0 && finishedSelectionBox.height > 0 && isInteractive) {
      void onSubmitSelectionBox(finishedSelectionBox);
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
  }
}

function getLiveGameState(
  playerState: RoomPlayerStateSnapshot | null,
  startedAt: string | null,
  authoritativeNow: number,
): GameState | null {
  if (!playerState?.gameState) {
    return null;
  }

  if (!startedAt) {
    return playerState.gameState;
  }

  return synchronizeGameClock(
    playerState.gameState,
    Math.max(0, authoritativeNow - Date.parse(startedAt)),
  );
}

function ScoreCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-white/6 px-5 py-4 shadow-[0_12px_36px_rgba(5,15,12,0.2)] backdrop-blur">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
        {label}
      </p>
      <p className={`mt-2 font-mono text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function MatchOverlay({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#16100ccc]/62 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.96),rgba(30,21,15,0.98))] p-8 text-center shadow-[0_24px_80px_rgba(5,15,12,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f9deb6]">
          Fruitbox Ranked
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white">{title}</h2>
        <p className="mt-4 text-base text-[#f0d7bc]">{subtitle}</p>
      </div>
    </div>
  );
}

function resolveMatchTitle(myScore: number, opponentScore: number): string {
  if (myScore > opponentScore) {
    return "You Win";
  }

  if (myScore < opponentScore) {
    return "You Lose";
  }

  return "Draw";
}

function formatTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
