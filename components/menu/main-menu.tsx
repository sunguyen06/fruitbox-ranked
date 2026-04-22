interface MainMenuProps {
  connectionStatus: "disabled" | "connecting" | "connected" | "disconnected";
  statusMessage: string | null;
  onFindRanked: () => void;
  onFindCasual: () => void;
  onCreatePrivateRoom: () => void;
  onJoinPrivateRoom: () => void;
}

export function MainMenu({
  connectionStatus,
  statusMessage,
  onFindRanked,
  onFindCasual,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
}: MainMenuProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-gray-100">
      <div className="w-full max-w-[720px] rounded-lg bg-white p-6 shadow-lg">
        <div className="space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-stone-800">Fruitbox</h1>
            <p className="text-sm text-stone-500">
              Multiplayer foundation menu
            </p>
          </header>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            Realtime status:{" "}
            <span className="font-semibold capitalize text-stone-800">{connectionStatus}</span>
          </div>

          {statusMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {statusMessage}
            </div>
          ) : null}

          <div className="grid gap-3">
            <button
              type="button"
              onClick={onFindRanked}
              className="rounded-lg bg-stone-900 px-4 py-4 text-left text-white transition hover:bg-stone-800"
            >
              <div className="font-semibold">Find Ranked Match</div>
              <div className="mt-1 text-sm text-stone-300">
                Queue flow can be wired in later.
              </div>
            </button>

            <button
              type="button"
              onClick={onFindCasual}
              className="rounded-lg bg-stone-900 px-4 py-4 text-left text-white transition hover:bg-stone-800"
            >
              <div className="font-semibold">Find Casual Match</div>
              <div className="mt-1 text-sm text-stone-300">
                Queue flow can be wired in later.
              </div>
            </button>

            <button
              type="button"
              onClick={onCreatePrivateRoom}
              className="rounded-lg bg-[#1d6f42] px-4 py-4 text-left text-white transition hover:bg-[#175a35]"
            >
              <div className="font-semibold">Create Private Room</div>
              <div className="mt-1 text-sm text-green-100">
                Create a lobby, share a code, and start when ready.
              </div>
            </button>

            <button
              type="button"
              onClick={onJoinPrivateRoom}
              className="rounded-lg border border-stone-300 bg-white px-4 py-4 text-left text-stone-800 transition hover:border-stone-400"
            >
              <div className="font-semibold">Join Private Room</div>
              <div className="mt-1 text-sm text-stone-500">
                Enter a room code and join an existing lobby.
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
