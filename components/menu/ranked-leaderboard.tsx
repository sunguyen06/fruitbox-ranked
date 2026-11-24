"use client";

import { useEffect, useId, useRef, useState } from "react";

import { getRankTier } from "@/lib/ranks";

interface RankedPlayer {
  place: number;
  displayName: string;
  handle: string | null;
  rankedElo: number;
}

type LeaderboardState =
  | { status: "loading" | "error" }
  | { status: "ready"; players: RankedPlayer[] };

export function RankedLeaderboard() {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<LeaderboardState>({ status: "loading" });

  useEffect(() => () => request.current?.abort(), []);

  async function loadStandings() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/leaderboard", { signal: controller.signal });
      if (!response.ok) throw new Error("Leaderboard request failed");
      const players: RankedPlayer[] = await response.json();
      if (!controller.signal.aborted) setState({ status: "ready", players });
    } catch {
      if (!controller.signal.aborted) setState({ status: "error" });
    }
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          void loadStandings();
        }}
        className="rounded-full border border-[#ffd28f]/25 bg-[#6a4e1f]/25 px-3 py-2 text-xs font-semibold text-[#ffe1b2] transition hover:bg-[#6a4e1f]/50 sm:px-4"
      >
        Leaderboard
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => { if (!dialog.current?.open) request.current?.abort(); }}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-[1.6rem] border border-[#ffd28f]/25 bg-[#251811] text-[#fff0de] shadow-2xl backdrop:bg-black/65"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#251811] px-4 py-4 sm:px-6">
          <h2 id={titleId} className="text-xl font-bold sm:text-2xl">Ranked Leaderboard</h2>
          <form method="dialog">
            <button className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">
              Close
            </button>
          </form>
        </div>

        <div className="px-4 pb-5 pt-3 sm:px-6">
          {state.status === "loading" && <p role="status" className="py-5">Loading standings…</p>}
          {state.status === "error" && (
            <div className="flex flex-wrap items-center gap-3 py-5">
              <p role="alert">Couldn’t load the leaderboard.</p>
              <button type="button" onClick={() => void loadStandings()} className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">
                Try again
              </button>
            </div>
          )}
          {state.status === "ready" && (state.players.length > 0 ? (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="text-[#f9deb6]">
                <tr>
                  <th scope="col" className="px-2 py-2">Rank</th>
                  <th scope="col" className="px-2 py-2">Player</th>
                  <th scope="col" className="px-2 py-2 text-right">Elo</th>
                </tr>
              </thead>
              <tbody>
                {state.players.map((player, index) => (
                  <tr key={index} className="border-t border-white/10">
                    <td className="px-2 py-2 tabular-nums text-[#f9deb6]">{player.place}</td>
                    <td className="px-2 py-2">
                      <span className="block break-all font-semibold">{player.displayName}</span>
                      {player.handle && <span className="block break-all text-xs text-[#dfbfaa]">@{player.handle}</span>}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className="block font-bold tabular-nums text-[#ffbe60]">{player.rankedElo}</span>
                      <span className="text-xs text-[#dfbfaa]">{getRankTier(player.rankedElo).name}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p role="status" className="py-5">No players yet.</p>)}
        </div>
      </dialog>
    </>
  );
}
