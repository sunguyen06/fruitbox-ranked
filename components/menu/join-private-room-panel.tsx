interface JoinPrivateRoomPanelProps {
  joinCode: string;
  statusMessage: string | null;
  onJoinCodeChange: (value: string) => void;
  onBack: () => void;
  onJoin: () => void;
}

export function JoinPrivateRoomPanel({
  joinCode,
  statusMessage,
  onJoinCodeChange,
  onBack,
  onJoin,
}: JoinPrivateRoomPanelProps) {
  return (
    <div className="mx-auto w-full max-w-[720px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.9),rgba(30,21,15,0.92))] p-6 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-8">
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            Join Private Room
          </h2>
          <p className="mx-auto max-w-lg text-sm text-[#f0d7bc] sm:text-base">
            Enter a room code to join the same seeded private match and be ranked by score with everyone else in the room.
          </p>
        </div>

        {statusMessage ? (
          <div className="rounded-[1.4rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
            {statusMessage}
          </div>
        ) : null}

        <div className="space-y-3">
          <label
            htmlFor="room-code"
            className="block text-xs font-semibold uppercase tracking-[0.26em] text-[#f9deb6]"
          >
            Room Code
          </label>
          <input
            id="room-code"
            value={joinCode}
            onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full rounded-[1.4rem] border border-white/12 bg-white/[0.08] px-5 py-4 font-mono text-2xl tracking-[0.26em] text-white outline-none transition placeholder:text-white/24 focus:border-[#ffb347] focus:bg-white/10"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={onBack}
            className="rounded-[1.25rem] border border-white/12 bg-white/6 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#fff0de] transition hover:bg-white/10"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onJoin}
            className="rounded-[1.25rem] bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(255,143,63,0.3)] transition hover:brightness-110"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
