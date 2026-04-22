"use client";

import { useState } from "react";

import { PrivateMatchGame } from "@/components/game/private-match-game";
import { FruitboxRankedLogo } from "@/components/menu/fruitbox-ranked-logo";
import { JoinPrivateRoomPanel } from "@/components/menu/join-private-room-panel";
import { MainMenu } from "@/components/menu/main-menu";
import { MenuShell } from "@/components/menu/menu-shell";
import { PrivateRoomLobby } from "@/components/menu/private-room-lobby";
import { useRoomClient } from "@/lib/multiplayer";

interface FruitboxHomeProps {
  fallbackSeed?: string;
}

type MenuView = "main" | "join-private";

export function FruitboxHome({}: FruitboxHomeProps) {
  const [view, setView] = useState<MenuView>("main");
  const [joinCode, setJoinCode] = useState("");
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const roomClient = useRoomClient();

  if (
    roomClient.currentRoom &&
    roomClient.sessionId &&
    roomClient.currentRoom.status !== "waiting"
  ) {
    return (
      <PrivateMatchGame
        room={roomClient.currentRoom}
        sessionId={roomClient.sessionId}
        serverTimeOffsetMs={roomClient.serverTimeOffsetMs}
        statusMessage={roomClient.statusMessage}
        onLeave={roomClient.leaveCurrentRoom}
        onSubmitSelectionBox={roomClient.submitSelectionBox}
      />
    );
  }

  if (roomClient.currentRoom) {
    return (
      <MenuShell connectionStatus={roomClient.connectionStatus}>
        <div className="flex flex-col items-center gap-8">
          <FruitboxRankedLogo compact />
          <PrivateRoomLobby
            room={roomClient.currentRoom}
            isHost={roomClient.isHost}
            canStart={roomClient.canStartCurrentRoom}
            statusMessage={roomClient.statusMessage}
            onStart={roomClient.startCurrentRoom}
            onLeave={roomClient.leaveCurrentRoom}
          />
        </div>
      </MenuShell>
    );
  }

  if (view === "join-private") {
    return (
      <MenuShell connectionStatus={roomClient.connectionStatus}>
        <div className="flex flex-col items-center gap-8">
          <FruitboxRankedLogo compact />
          <JoinPrivateRoomPanel
            joinCode={joinCode}
            statusMessage={roomClient.statusMessage ?? menuMessage}
            onJoinCodeChange={(value) => {
              setJoinCode(value);
              roomClient.clearStatus();
              setMenuMessage(null);
            }}
            onBack={() => {
              setView("main");
              roomClient.clearStatus();
              setMenuMessage(null);
            }}
            onJoin={() => {
              setMenuMessage(null);
              void roomClient.joinPrivateRoom(joinCode);
            }}
          />
        </div>
      </MenuShell>
    );
  }

  return (
    <MenuShell connectionStatus={roomClient.connectionStatus}>
      <div className="flex flex-col items-center gap-8">
        <FruitboxRankedLogo compact={false} />
        <MainMenu
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
      </div>
    </MenuShell>
  );
}
