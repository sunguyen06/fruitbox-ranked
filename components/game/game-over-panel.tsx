interface GameOverPanelProps {
  score: number;
  seed: string;
  onRestart: () => void;
  onNewSeed: () => void;
}

export function GameOverPanel({
  score,
  seed,
  onRestart,
  onNewSeed,
}: GameOverPanelProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#10211d]/72 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-[#fff7ec] p-8 text-center shadow-[0_24px_80px_rgba(5,15,12,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-stone-500">
          Match Complete
        </p>
        <h2 className="mt-3 text-4xl font-semibold text-stone-900">Game Over</h2>
        <p className="mt-5 text-sm text-stone-600">Final score</p>
        <p className="mt-2 font-mono text-6xl font-semibold text-[#ff6b35]">{score}</p>
        <p className="mt-5 text-sm text-stone-600">
          Seed <span className="font-mono text-stone-900">{seed}</span>
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full bg-[#1d6f42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#175a35]"
          >
            Replay Seed
          </button>
          <button
            type="button"
            onClick={onNewSeed}
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400"
          >
            Fresh Seed
          </button>
        </div>
      </div>
    </div>
  );
}
