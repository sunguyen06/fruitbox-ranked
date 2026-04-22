"use client";

import { useEffect, useState } from "react";
import type { RoomSnapshot } from "@/lib/multiplayer";

interface PrivateRoomLobbyProps {
  room: RoomSnapshot;
  isHost: boolean;
  canStart: boolean;
  statusMessage: string | null;
  onStart: () => void;
  onLeave: () => void;
}

export function PrivateRoomLobby({
  room,
  isHost,
  canStart,
  statusMessage,
  onStart,
  onLeave,
}: PrivateRoomLobbyProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  function handleCopyCode() {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
  }

  return (
    <div className="mx-auto w-full max-w-[920px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.92),rgba(30,21,15,0.92))] p-6 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              Private Room
            </h2>
            <p className="max-w-xl text-sm text-[#f0d7bc] sm:text-base">
              Share this room code, wait for your opponent, and start the same-seed match together.
            </p>
          </div>

          <button
            type="button"
            onClick={onLeave}
            className="rounded-[1.15rem] border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#fff0de] transition hover:bg-white/10"
          >
            Leave Room
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_1.35fr]">
          <section className="space-y-4 rounded-[1.7rem] border border-white/10 bg-white/5 p-5">
            <div className="rounded-[1.4rem] border border-white/10 bg-[#171022] px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
                    Room Code
                  </p>
                  <p className="mt-3 font-mono text-4xl font-black tracking-[0.28em] text-white">
                    {room.roomCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-[1.1rem] border border-white/12 bg-white/6 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff0de] transition hover:bg-white/10 active:bg-white/20"
                  title="Copy room code to clipboard"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 text-sm text-[#f4dfca]">
              {room.status === "waiting"
                ? `Waiting for players: ${room.players.length}/${room.playerCapacity}`
                : "Match is starting."}
            </div>

            {statusMessage ? (
              <div className="rounded-[1.4rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
                {statusMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="w-full rounded-[1.3rem] bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(255,143,63,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[linear-gradient(135deg,#7a6854,#97826a)] disabled:shadow-none"
            >
              {isHost ? "Start Match" : "Host Starts Match"}
            </button>
          </section>

          <section className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Players in Room</h3>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4dfca]">
                {room.players.length}/{room.playerCapacity}
              </span>
            </div>

            <div className="grid gap-3">
              {room.players.map((player, index) => (
                <div
                  key={player.sessionId}
                  className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb347,#ff6f35)] text-base font-black text-white shadow-[0_10px_28px_rgba(255,111,53,0.22)]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{player.displayName}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#e0b98d]">
                        {player.sessionId.slice(0, 10)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={
                      player.isHost
                        ? "rounded-full border border-[#ffd28f]/22 bg-[#6a4e1f]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd99d]"
                        : "rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3e4cf]"
                    }
                  >
                    {player.isHost ? "Host" : "Player"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
