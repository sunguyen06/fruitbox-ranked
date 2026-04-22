"use client";

import { useState } from "react";

import { FruitboxGame } from "@/components/game/fruitbox-game";
import { MainMenu } from "@/components/menu/main-menu";
import { PrivateRoomLobby } from "@/components/menu/private-room-lobby";
import { useRoomClient } from "@/lib/multiplayer";

interface FruitboxHomeProps {
  fallbackSeed: string;
}

type MenuView = "main" | "join-private";

export function FruitboxHome({ fallbackSeed }: FruitboxHomeProps) {
  const [view, setView] = useState<MenuView>("main");
  const [joinCode, setJoinCode] = useState("");
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const roomClient = useRoomClient();

  if (roomClient.currentRoom?.status === "active") {
    return (
      <FruitboxGame
        initialSeed={roomClient.currentRoom.matchConfig.seed || fallbackSeed}
      />
    );
  }

  if (roomClient.currentRoom) {
    return (
      <PrivateRoomLobby
        room={roomClient.currentRoom}
        isHost={roomClient.isHost}
        canStart={roomClient.canStartCurrentRoom}
        statusMessage={roomClient.statusMessage}
        onStart={roomClient.startCurrentRoom}
        onLeave={roomClient.leaveCurrentRoom}
      />
    );
  }

  if (view === "join-private") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-gray-100">
        <div className="w-full max-w-[620px] rounded-lg bg-white p-6 shadow-lg">
          <div className="space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-stone-800">Join Private Room</h1>
              <p className="text-sm text-stone-500">
                Enter a room code to join an existing private room.
              </p>
            </header>

            {roomClient.statusMessage || menuMessage ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {roomClient.statusMessage ?? menuMessage}
              </div>
            ) : null}

            <div className="space-y-3">
              <label
                htmlFor="room-code"
                className="block text-sm font-medium text-stone-700"
              >
                Room Code
              </label>
              <input
                id="room-code"
                value={joinCode}
                onChange={(event) => {
                  setJoinCode(event.target.value.toUpperCase());
                  roomClient.clearStatus();
                  setMenuMessage(null);
                }}
                placeholder="ABC123"
                className="w-full rounded-full border border-stone-300 px-5 py-4 font-mono text-lg tracking-[0.2em] text-stone-900 outline-none transition focus:border-stone-500"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setView("main");
                  roomClient.clearStatus();
                  setMenuMessage(null);
                }}
                className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuMessage(null);
                  void roomClient.joinPrivateRoom(joinCode);
                }}
                className="rounded-lg bg-[#1d6f42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#175a35]"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <MainMenu
      connectionStatus={roomClient.connectionStatus}
      statusMessage={roomClient.statusMessage ?? menuMessage}
      onFindRanked={() => {
        roomClient.clearStatus();
        setMenuMessage("Ranked matchmaking queue will be added next.");
      }}
      onFindCasual={() => {
        roomClient.clearStatus();
        setMenuMessage("Casual matchmaking queue will be added next.");
      }}
      onCreatePrivateRoom={() => {
        setMenuMessage(null);
        void roomClient.createPrivateRoom();
      }}
      onJoinPrivateRoom={() => {
        roomClient.clearStatus();
        setMenuMessage(null);
        setJoinCode("");
        setView("join-private");
      }}
    />
  );
}
