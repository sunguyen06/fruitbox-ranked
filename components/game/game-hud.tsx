interface GameHudProps {
  score: number;
  remainingMs: number;
  seed: string;
  onRestart: () => void;
  onNewSeed: () => void;
}

export function GameHud({
  score,
  remainingMs,
  seed,
  onRestart,
  onNewSeed,
}: GameHudProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-1">
        <HudCard label="Score" value={score.toString()} accent="text-[#ff6b35]" />
        <HudCard label="Time" value={formatTime(remainingMs)} accent="text-[#0f9d58]" />
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        <div className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 shadow-[0_12px_36px_rgba(64,37,23,0.08)] backdrop-blur">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
            Current Seed
          </p>
          <p className="mt-1 font-mono text-sm text-stone-800 sm:text-base">{seed}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full bg-[#1d6f42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#175a35]"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onNewSeed}
            className="rounded-full border border-stone-300 bg-white/80 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-white"
          >
            New Seed
          </button>
        </div>
      </div>
    </div>
  );
}

function HudCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_12px_36px_rgba(64,37,23,0.08)] backdrop-blur">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
        {label}
      </p>
      <p className={`mt-2 font-mono text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function formatTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
