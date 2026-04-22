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
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-gray-100">
      <div className="w-full max-w-[840px] rounded-lg bg-white p-6 shadow-lg">
        <div className="space-y-6">
          <header className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-stone-800">Private Room</h1>
                <p className="text-sm text-stone-500">
                  Share this code with another player to join the room.
                </p>
              </div>
              <button
                type="button"
                onClick={onLeave}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400"
              >
                Leave Room
              </button>
            </div>
          </header>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Room Code</p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-[0.24em] text-stone-900">
              {room.roomCode}
            </p>
          </div>

          {statusMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {statusMessage}
            </div>
          ) : null}

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            {room.status === "waiting"
              ? `Waiting for players: ${room.players.length}/${room.playerCapacity}`
              : "Match is starting."}
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-800">Players in Room</h2>
              <span className="text-sm text-stone-500">
                {room.players.length}/{room.playerCapacity}
              </span>
            </div>

            <div className="grid gap-3">
              {room.players.map((player) => (
                <div
                  key={player.sessionId}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">{player.displayName}</p>
                      <p className="text-xs text-stone-500">{player.sessionId}</p>
                    </div>
                    {player.isHost ? (
                      <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
                        Host
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                        Player
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="rounded-lg bg-[#1d6f42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#175a35] disabled:cursor-not-allowed disabled:bg-[#80ad95]"
            >
              {isHost ? "Start Match" : "Host Starts Match"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
