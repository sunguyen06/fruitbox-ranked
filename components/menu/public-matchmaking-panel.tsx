"use client";

import { getRankTier } from "@/lib/ranks";
import type { MatchmakingQueueSnapshot } from "@/lib/multiplayer";

interface PublicMatchmakingPanelProps {
  queue: MatchmakingQueueSnapshot;
  rankedElo: number;
  statusMessage: string | null;
  onCancel: () => void;
}

export function PublicMatchmakingPanel({
  queue,
  rankedElo,
  statusMessage,
  onCancel,
}: PublicMatchmakingPanelProps) {
  const rankTier = getRankTier(rankedElo);
  const joinedAt = new Date(queue.queuedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const title = queue.kind === "ranked" ? "Searching Ranked Queue" : "Searching Casual Queue";
  const description =
    queue.kind === "ranked"
      ? "Matchmaking is using your visible Elo tier to look for a fair public match."
      : "Matchmaking is using your hidden casual MMR to look for a fair public match.";

  return (
    <div className="mx-auto w-full max-w-[760px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.92),rgba(30,21,15,0.94))] p-6 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-7">
      <div className="space-y-6">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
            Matchmaking
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm text-[#f0d7bc] sm:text-base">{description}</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
              Queue Type
            </p>
            <p className="mt-2 text-xl font-bold text-white">
              {queue.kind === "ranked" ? "Ranked" : "Casual"}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
              Entered Queue
            </p>
            <p className="mt-2 text-xl font-bold text-white">{joinedAt}</p>
          </div>
        </div>

        {queue.kind === "ranked" ? (
          <div className="rounded-[1.6rem] border border-[#ffd28f]/18 bg-[linear-gradient(135deg,rgba(255,179,71,0.2),rgba(255,143,63,0.12))] px-5 py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
              Current Ranked Tier
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-2xl font-black tracking-[-0.03em] text-white">
                <span className="mr-2">{rankTier.emoji}</span>
                {rankTier.name}
              </p>
              <p className="font-mono text-2xl font-semibold text-[#fff3df]">{rankedElo}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-5 py-5 text-sm text-[#f0d7bc]">
            Casual queue is not shown on your profile. It uses a separate hidden MMR behind the
            scenes.
          </div>
        )}

        {statusMessage ? (
          <div className="rounded-[1.4rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
            {statusMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-[1.3rem] border border-white/12 bg-white/6 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[#fff0de] transition hover:bg-white/10"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
}
