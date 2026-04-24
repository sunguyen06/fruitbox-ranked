"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/auth-client";
import type { MatchHistoryEntry } from "@/lib/profile";
import { getRankTier } from "@/lib/ranks";
import { useSoundEffectsVolume } from "@/lib/sound-effects";

interface AccountMenuClientProps {
  viewer: {
    user: {
      name: string;
    };
    profile: {
      displayName: string;
      handle: string;
      rankedElo: number;
    };
    matchHistory: MatchHistoryEntry[];
  } | null;
}

export function AccountMenuClient({ viewer }: AccountMenuClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOpen = openPathname === pathname;
  const rankTier = viewer ? getRankTier(viewer.profile.rankedElo) : null;
  const { volume, setVolume } = useSoundEffectsVolume();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPathname(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isHistoryOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsHistoryOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHistoryOpen]);

  if (!viewer) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="rounded-full border border-white/12 bg-white/[0.07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f2d9be] backdrop-blur transition hover:bg-white/[0.12]"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_45px_rgba(255,143,63,0.22)] transition hover:brightness-110"
        >
          Create Account
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() =>
          setOpenPathname((current) => (current === pathname ? null : pathname))
        }
        className="flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.07] px-3 py-2 text-left backdrop-blur transition hover:bg-white/[0.12]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] text-sm font-black text-white shadow-[0_10px_28px_rgba(255,111,53,0.22)]">
          {viewer.profile.displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="rounded-full border border-[#ffd28f]/22 bg-[#6a4e1f]/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ffd99d]">
          {rankTier?.emoji} {viewer.profile.rankedElo}
        </span>
        <span className="hidden sm:block">
          <span className="block max-w-[12rem] truncate text-sm font-semibold text-white">
            {viewer.profile.displayName}
          </span>
          <span className="block max-w-[12rem] truncate text-[0.65rem] uppercase tracking-[0.22em] text-[#f2d9be]">
            {rankTier?.emoji} {viewer.profile.rankedElo} Elo
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[320px] rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.96),rgba(30,21,15,0.98))] p-3 shadow-[0_24px_80px_rgba(5,15,12,0.35)]">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {viewer.profile.displayName}
            </p>
            <p className="truncate text-xs text-[#f0d7bc]">
              @{viewer.profile.handle}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f9deb6]">
              {rankTier?.emoji} {viewer.profile.rankedElo} Elo
            </p>
          </div>

          <CompactProfileForm profile={viewer.profile} />

          <div className="mt-3 rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#f0d7bc]">
            <div className="flex items-center justify-between gap-4">
              <span>Sound Effects</span>
              <span className="font-mono text-white">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(volume * 100)}
              onChange={(event) => {
                setVolume(Number(event.target.value) / 100);
              }}
              className="mt-3 h-2 w-full cursor-pointer accent-[#ffb347]"
              aria-label="Sound effects volume"
            />
            <p className="mt-2 text-xs text-[#e0b98d]">
              Controls countdown, combo, and timer-end sounds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpenPathname(null);
              setIsHistoryOpen(true);
            }}
            className="mt-3 w-full rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-left text-sm font-semibold text-[#fff0de] transition hover:bg-white/10"
          >
            Match History
          </button>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              setOpenPathname(null);
              router.replace("/");
              router.refresh();
            }}
            className="mt-3 w-full rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-left text-sm font-semibold text-[#fff0de] transition hover:bg-white/10"
          >
            Sign Out
          </button>
        </div>
      ) : null}

      {isHistoryOpen ? (
        <MatchHistoryModal
          displayName={viewer.profile.displayName}
          history={viewer.matchHistory}
          onClose={() => setIsHistoryOpen(false)}
        />
      ) : null}
    </div>
  );
}

function CompactProfileForm({
  profile,
}: {
  profile: {
    displayName: string;
    handle: string;
    rankedElo: number;
  };
}) {
  const rankTier = getRankTier(profile.rankedElo);

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#f0d7bc]">
        <div className="flex items-center justify-between gap-4">
          <span>Elo</span>
          <span className="font-mono text-white">{profile.rankedElo}</span>
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f9deb6]">
          {rankTier.emoji} {rankTier.name}
        </div>
      </div>
    </div>
  );
}

function MatchHistoryModal({
  displayName,
  history,
  onClose,
}: {
  displayName: string;
  history: MatchHistoryEntry[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#120d0ac7] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.98),rgba(30,21,15,1))] p-5 shadow-[0_28px_120px_rgba(6,4,18,0.52)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f9deb6]">
              Player Profile
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
              {displayName} Match History
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[1rem] border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-[#fff0de] transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-8 text-center text-[#f0d7bc]">
              No matches recorded yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#ffd28f]/18 bg-[#6a4e1f]/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#ffd99d]">
                          {formatMatchKind(entry.match.kind)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#f0d7bc]">
                          {formatMatchStatus(entry.match.status)}
                        </span>
                        {entry.wasHost ? (
                          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#f0d7bc]">
                            Host
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-lg font-bold text-white">
                        {entry.placement ? `Placed ${ordinal(entry.placement)}` : "Placement pending"}
                      </p>
                      <p className="mt-1 text-sm text-[#f0d7bc]">
                        {formatMatchTimestamp(entry.match.finishedAt ?? entry.joinedAt)}
                      </p>
                      {entry.match.roomCode ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#e0b98d]">
                          Room {entry.match.roomCode}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid min-w-[220px] gap-2 sm:grid-cols-3 lg:grid-cols-1">
                      <HistoryStat label="Score" value={entry.score?.toString() ?? "--"} />
                      <HistoryStat
                        label="Players"
                        value={entry.match.participantCount.toString()}
                      />
                      <HistoryStat
                        label="Result"
                        value={entry.didFinish ? "Finished" : "DNF"}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#f9deb6]">
                      Lobby Standings
                    </p>
                    <div className="mt-3 grid gap-2">
                      {entry.match.participants.map((participant, index) => (
                        <div
                          key={`${entry.id}-${participant.userId}`}
                          className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-[#1f1713] px-4 py-3 text-sm text-[#f0d7bc]"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {participant.placement ? ordinal(participant.placement) : ordinal(index + 1)}{" "}
                              - {participant.displayNameSnapshot}
                            </p>
                            {participant.handleSnapshot ? (
                              <p className="text-xs uppercase tracking-[0.16em] text-[#e0b98d]">
                                @{participant.handleSnapshot}
                              </p>
                            ) : null}
                          </div>
                          <p className="font-mono text-base font-semibold text-white">
                            {participant.score ?? "--"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-[#1f1713] px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#f9deb6]">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function formatMatchKind(kind: string) {
  return kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
}

function formatMatchStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatMatchTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
