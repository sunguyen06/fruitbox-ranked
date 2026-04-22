interface MainMenuProps {
  statusMessage: string | null;
  onFindRanked: () => void;
  onFindCasual: () => void;
  onCreatePrivateRoom: () => void;
  onJoinPrivateRoom: () => void;
}

export function MainMenu({
  statusMessage,
  onFindRanked,
  onFindCasual,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
}: MainMenuProps) {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.9),rgba(30,21,15,0.92))] p-5 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-7">
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-[#f0d7bc]">
              Choose how you want to enter the arena.
            </p>
          </div>

          {statusMessage ? (
            <div className="rounded-[1.4rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
              {statusMessage}
            </div>
          ) : null}

          <div className="grid gap-4">
            <ActionButton
              title="Find Ranked Match"
              description="Battle on the same seed in the competitive ladder."
              accent="apple"
              onClick={onFindRanked}
            />

            <ActionButton
              title="Find Casual Match"
              description="Jump into a relaxed public match without ranked pressure."
              accent="gold"
              onClick={onFindCasual}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ActionButton
                title="Create Private Room"
                description="Open a lobby, share the code, and start once both players are in."
                accent="leaf"
                onClick={onCreatePrivateRoom}
              />

              <ActionButton
                title="Join Private Room"
                description="Enter a room code to join a friend's lobby."
                accent="glass"
                onClick={onJoinPrivateRoom}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  title: string;
  description: string;
  accent: "apple" | "gold" | "leaf" | "glass";
  onClick: () => void;
}

function ActionButton({
  title,
  description,
  accent,
  onClick,
}: ActionButtonProps) {
  const styles = {
    apple:
      "border-transparent bg-[linear-gradient(135deg,#ff6f35_0%,#ff9a3d_100%)] text-white shadow-[0_22px_48px_rgba(255,111,53,0.28)] hover:brightness-110",
    gold:
      "border-transparent bg-[linear-gradient(135deg,#ffb347_0%,#ffd15c_100%)] text-[#4a2300] shadow-[0_22px_48px_rgba(255,179,71,0.24)] hover:brightness-110",
    leaf:
      "border-transparent bg-[linear-gradient(135deg,#2f9a54_0%,#61c977_100%)] text-white shadow-[0_22px_48px_rgba(47,154,84,0.24)] hover:brightness-110",
    glass:
      "border-white/12 bg-white/6 text-white hover:bg-white/10",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[1.6rem] border px-5 py-5 text-left transition ${styles[accent]}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_42%)] opacity-70" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-bold tracking-[-0.02em]">{title}</div>
          <div className="mt-2 max-w-[32rem] text-sm leading-6 text-white/75">
            {description}
          </div>
        </div>
        <div className="text-3xl text-white/75 transition group-hover:translate-x-1">{">"}</div>
      </div>
    </button>
  );
}
