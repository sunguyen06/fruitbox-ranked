"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";

import { GameBoard } from "@/components/game/game-board";
import { MenuShell } from "@/components/menu/menu-shell";
import {
  applySelectionBoxToGame,
  getSelectionPreview,
  synchronizeGameClock,
  type GameState,
  type NormalizedSelectionBox,
} from "@/lib/game";
import type { RoomPlayerStateSnapshot, RoomSnapshot } from "@/lib/multiplayer";

interface PrivateMatchGameProps {
  room: RoomSnapshot;
  userId: string;
  isHost: boolean;
  serverTimeOffsetMs: number;
  statusMessage: string | null;
  onLeave: () => void;
  onPlayAgain: () => void;
  onSubmitSelectionBox: (selectionBox: NormalizedSelectionBox) => Promise<boolean>;
}

interface DragSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function PrivateMatchGame({
  room,
  userId,
  isHost,
  serverTimeOffsetMs,
  statusMessage,
  onLeave,
  onPlayAgain,
  onSubmitSelectionBox,
}: PrivateMatchGameProps) {
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [renderNow, setRenderNow] = useState(() => Date.now());
  const [optimisticGameState, setOptimisticGameState] = useState<GameState | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRenderNow(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const authoritativeNow = renderNow + serverTimeOffsetMs;
  const myPlayer = room.playerStates.find((playerState) => playerState.userId === userId) ?? null;
  const standings = useMemo(
    () =>
      [...room.playerStates].sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.displayName.localeCompare(right.displayName);
      }),
    [room.playerStates],
  );
  const myPlacement =
    standings.findIndex((playerState) => playerState.userId === userId) + 1;
  const myAuthoritativeGameState = getLiveGameState(myPlayer, room.startedAt, authoritativeNow);
  const myGameState = optimisticGameState
    ? getLiveGameStateFromState(optimisticGameState, room.startedAt, authoritativeNow)
    : myAuthoritativeGameState;

  useEffect(() => {
    if (!optimisticGameState) {
      return;
    }

    if (!myAuthoritativeGameState) {
      setOptimisticGameState(null);
      setIsSubmittingMove(false);
      return;
    }

    if (
      myAuthoritativeGameState.appliedMoveCount >= optimisticGameState.appliedMoveCount ||
      myAuthoritativeGameState.status !== "active"
    ) {
      setOptimisticGameState(null);
      setIsSubmittingMove(false);
    }
  }, [myAuthoritativeGameState, optimisticGameState]);

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
  const countdownSecondsRemaining =
    countdownRemainingMs > 0 ? Math.max(1, Math.ceil(countdownRemainingMs / 1000)) : null;
  const isInteractive =
    room.status === "active" &&
    !!myGameState &&
    myGameState.status === "active" &&
    !isSubmittingMove;
  const isMatchFinished =
    room.status === "finished" ||
    (!!myGameState && standings.every((playerState) => playerState.gameState?.status === "ended"));
  const countdownAudioContextRef = useRef<AudioContext | null>(null);
  const boxOfTenSoundRef = useRef<HTMLAudioElement | null>(null);
  const lastMatchIdRef = useRef(room.matchId);
  const lastCountdownSecondRef = useRef<number | null>(null);
  const lastPlayedMoveCountRef = useRef(myGameState?.appliedMoveCount ?? 0);
  const appliedMoveCount = myGameState?.appliedMoveCount ?? 0;
  const lastMoveWasValid = myGameState?.lastMove?.isValid ?? false;
  const lastMoveSelectedSum = myGameState?.lastMove?.selectedSum ?? null;

  function ensureCountdownAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextConstructor = getAudioContextConstructor(window);

    if (!AudioContextConstructor) {
      return null;
    }

    if (!countdownAudioContextRef.current) {
      countdownAudioContextRef.current = new AudioContextConstructor();
    }

    return countdownAudioContextRef.current;
  }

  function unlockMatchAudio() {
    const audioContext = ensureCountdownAudioContext();

    if (audioContext?.state === "suspended") {
      void audioContext.resume().catch(() => {
        // Browser autoplay policies may still block until a trusted interaction occurs.
      });
    }
  }

  const playCountdownTone = useEffectEvent((secondsRemaining: number) => {
    const audioContext = ensureCountdownAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => {
        // Ignore resume failures and let later user gestures unlock audio.
      });
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const durationSeconds = secondsRemaining <= 1 ? 0.34 : 0.24;

    oscillator.type = secondsRemaining <= 1 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(380 + (6 - Math.min(secondsRemaining, 5)) * 80, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(secondsRemaining <= 1 ? 0.18 : 0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  });

  const playBoxOfTenSound = useEffectEvent(() => {
    const sound = boxOfTenSoundRef.current;

    if (!sound) {
      return;
    }

    sound.currentTime = 0;
    void sound.play().catch(() => {
      // Missing files or autoplay blocks should not break gameplay.
    });
  });

  useEffect(() => {
    const boxOfTenSound = new Audio("/sounds/box-of-10.mp3");
    boxOfTenSound.preload = "auto";
    boxOfTenSoundRef.current = boxOfTenSound;

    return () => {
      boxOfTenSound.pause();
      boxOfTenSoundRef.current = null;

      if (countdownAudioContextRef.current) {
        void countdownAudioContextRef.current.close().catch(() => {
          // Ignore teardown failures.
        });
        countdownAudioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleUnlock = () => {
      const audioContext = ensureCountdownAudioContext();

      if (audioContext?.state === "suspended") {
        void audioContext.resume().catch(() => {
          // Browser autoplay policies may still block until a trusted interaction occurs.
        });
      }
    };

    window.addEventListener("pointerdown", handleUnlock, { passive: true });
    window.addEventListener("keydown", handleUnlock);

    return () => {
      window.removeEventListener("pointerdown", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
    };
  }, []);

  useEffect(() => {
    if (lastMatchIdRef.current === room.matchId) {
      return;
    }

    lastMatchIdRef.current = room.matchId;
    lastCountdownSecondRef.current = countdownSecondsRemaining;
    lastPlayedMoveCountRef.current = appliedMoveCount;
  }, [appliedMoveCount, countdownSecondsRemaining, room.matchId]);

  useEffect(() => {
    if (countdownSecondsRemaining === null) {
      lastCountdownSecondRef.current = null;
      return;
    }

    if (lastCountdownSecondRef.current === countdownSecondsRemaining) {
      return;
    }

    lastCountdownSecondRef.current = countdownSecondsRemaining;
    playCountdownTone(countdownSecondsRemaining);
  }, [countdownSecondsRemaining]);

  useEffect(() => {
    if (appliedMoveCount <= lastPlayedMoveCountRef.current) {
      return;
    }

    lastPlayedMoveCountRef.current = appliedMoveCount;

    if (lastMoveWasValid && lastMoveSelectedSum === 10) {
      playBoxOfTenSound();
    }
  }, [appliedMoveCount, lastMoveSelectedSum, lastMoveWasValid]);

  if (!myGameState) {
    return (
      <MenuShell connectionStatus="connected" contentClassName="max-w-[1400px]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/6 p-8 text-center text-white/80 backdrop-blur">
          Waiting for your match state to load.
        </div>
      </MenuShell>
    );
  }

  return (
    <MenuShell connectionStatus="connected" contentClassName="max-w-[1400px]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.92),rgba(30,21,15,0.94))] p-5 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <ScoreCard
                label="Your Score"
                value={myGameState.score.toString()}
                accent="text-[#ffb347]"
              />
              <ScoreCard
                label="Placement"
                value={myPlacement > 0 ? ordinal(myPlacement) : "--"}
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
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <GameBoard
                  board={myGameState.board}
                  rows={myGameState.config.rows}
                  cols={myGameState.config.cols}
                  selectedCellIds={previewSelectedIds}
                  visualSelectionRect={visualSelectionRect}
                  selectionState={selectionState}
                  isInteractive={isInteractive}
                  showDisabledState={room.status !== "active" || myGameState.status !== "active"}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                />
              </div>

              <aside className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 lg:sticky lg:top-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f9deb6]">
                    Live Standings
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#f4dfca]">
                    {standings.length} player{standings.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid gap-2">
                  {standings.map((playerState, index) => (
                    <div
                      key={playerState.userId}
                      className={`flex items-center justify-between rounded-[1.15rem] px-4 py-3 text-sm ${
                        playerState.userId === userId
                          ? "border border-[#ffb347]/30 bg-[#6a4e1f]/22 text-[#fff3df]"
                          : "border border-white/10 bg-[#1f1713] text-[#f0d7bc]"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">
                          {ordinal(index + 1)} - {playerState.displayName}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#e0b98d]">
                          @{playerState.handle}
                        </p>
                      </div>
                      <p className="font-mono text-lg font-semibold text-white">
                        {playerState.score}
                      </p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            {countdownSecondsRemaining !== null ? (
              <CountdownOverlay secondsRemaining={countdownSecondsRemaining} />
            ) : null}

            {isMatchFinished ? (
              <MatchOverlay
                title={resolveMatchTitle(myPlacement, standings.length)}
                subtitle={`Final score ${myGameState.score} - ${myPlacement > 0 ? `${ordinal(myPlacement)} of ${standings.length}` : "Placement pending"}`}
              >
                {isHost ? (
                  <button
                    type="button"
                    onClick={onPlayAgain}
                    className="rounded-[1.2rem] bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(255,143,63,0.3)] transition hover:brightness-110"
                  >
                    Play Again
                  </button>
                ) : (
                  <p className="text-sm text-[#f9deb6]">
                    Waiting for the host to start another round.
                  </p>
                )}
              </MatchOverlay>
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

    unlockMatchAudio();

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
      void submitOptimisticMove(finishedSelectionBox);
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
  }

  async function submitOptimisticMove(selectionBox: NormalizedSelectionBox) {
    if (!myGameState) {
      return;
    }

    const optimisticNextState = applySelectionBoxToGame(myGameState, selectionBox);

    if (optimisticNextState.appliedMoveCount === myGameState.appliedMoveCount) {
      return;
    }

    setOptimisticGameState(optimisticNextState);
    setIsSubmittingMove(true);

    const wasAccepted = await onSubmitSelectionBox(selectionBox);

    if (!wasAccepted) {
      setOptimisticGameState(null);
      setIsSubmittingMove(false);
    }
  }
}

function getLiveGameStateFromState(
  gameState: GameState,
  startedAt: string | null,
  authoritativeNow: number,
): GameState {
  if (!startedAt) {
    return gameState;
  }

  return synchronizeGameClock(
    gameState,
    Math.max(0, authoritativeNow - Date.parse(startedAt)),
  );
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

function CountdownOverlay({ secondsRemaining }: { secondsRemaining: number }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#16100ccc]/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2.2rem] border border-[#ffd28f]/18 bg-[linear-gradient(180deg,rgba(55,33,20,0.98),rgba(30,21,15,0.98))] p-8 text-center shadow-[0_24px_80px_rgba(5,15,12,0.4)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f9deb6]">
          Private Match
        </p>
        <div className="mt-6 flex justify-center">
          <div className="flex h-40 w-40 animate-pulse items-center justify-center rounded-full border border-[#ffd28f]/28 bg-[radial-gradient(circle,rgba(255,179,71,0.22),rgba(255,179,71,0.04))] shadow-[0_0_0_10px_rgba(255,179,71,0.08)] sm:h-48 sm:w-48">
            <span className="font-mono text-[5.5rem] font-black leading-none text-white sm:text-[7rem]">
              {secondsRemaining}
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
          Get Ready
        </h2>
        <p className="mt-3 text-lg text-[#f0d7bc]">
          Match starts in {secondsRemaining} second{secondsRemaining === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

function MatchOverlay({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#16100ccc]/62 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.96),rgba(30,21,15,0.98))] p-8 text-center shadow-[0_24px_80px_rgba(5,15,12,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f9deb6]">
          Fruitbox Ranked
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white">{title}</h2>
        <p className="mt-4 text-base text-[#f0d7bc]">{subtitle}</p>
        {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
      </div>
    </div>
  );
}

interface AudioContextWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

function getAudioContextConstructor(
  audioWindow: AudioContextWindow,
): typeof AudioContext | null {
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function resolveMatchTitle(myPlacement: number, totalPlayers: number): string {
  if (totalPlayers <= 1) {
    return "Run Complete";
  }

  if (myPlacement <= 1) {
    return "1st Place";
  }

  return `${ordinal(myPlacement)} Place`;
}

function formatTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function ordinal(value: number): string {
  const mod100 = value % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}
