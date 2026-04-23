"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/lib/auth-client";
import { PrivateMatchGame } from "@/components/game/private-match-game";
import { FruitboxRankedLogo } from "@/components/menu/fruitbox-ranked-logo";
import { JoinPrivateRoomPanel } from "@/components/menu/join-private-room-panel";
import { MainMenu } from "@/components/menu/main-menu";
import { MenuShell } from "@/components/menu/menu-shell";
import { PrivateRoomLobby } from "@/components/menu/private-room-lobby";
import { useRoomClient } from "@/lib/multiplayer";

interface FruitboxHomeProps {
  fallbackSeed?: string;
  initialViewer: {
    user: {
      name: string;
    };
    profile: {
      displayName: string;
      handle: string;
      rankedRating: number;
    };
  } | null;
}

type MenuView = "main" | "join-private";

export function FruitboxHome({ fallbackSeed, initialViewer }: FruitboxHomeProps) {
  const [view, setView] = useState<MenuView>("main");
  const [joinCode, setJoinCode] = useState("");
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const isAuthenticated = !!session?.user;
  const roomClient = useRoomClient(isAuthenticated, fallbackSeed);
  const signInHref = buildSignInHref(pathname, searchParams);

  if (
    roomClient.currentRoom &&
    roomClient.userId &&
    roomClient.currentRoom.status !== "waiting"
  ) {
    return (
      <PrivateMatchGame
        room={roomClient.currentRoom}
        userId={roomClient.userId}
        isHost={roomClient.isHost}
        serverTimeOffsetMs={roomClient.serverTimeOffsetMs}
        statusMessage={roomClient.statusMessage}
        onLeave={roomClient.leaveCurrentRoom}
        onPlayAgain={roomClient.restartCurrentRoom}
        onSubmitSelectionBox={roomClient.submitSelectionBox}
      />
    );
  }

  if (roomClient.currentRoom) {
    return (
      <MenuShell connectionStatus={roomClient.connectionStatus} viewer={initialViewer}>
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
      <MenuShell connectionStatus={roomClient.connectionStatus} viewer={initialViewer}>
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
    <MenuShell connectionStatus={roomClient.connectionStatus} viewer={initialViewer}>
      <div className="flex flex-col items-center gap-8">
        <FruitboxRankedLogo compact={false} />
        <MainMenu
          statusMessage={roomClient.statusMessage ?? menuMessage}
          onFindRanked={() => {
            roomClient.clearStatus();
            setMenuMessage(
              isAuthenticated
                ? "Ranked matchmaking queue will be added next."
                : "Sign in first, then public ranked matchmaking will layer on top of this account system next.",
            );
          }}
          onFindCasual={() => {
            roomClient.clearStatus();
            setMenuMessage(
              isAuthenticated
                ? "Casual matchmaking queue will be added next."
                : "Sign in first, then casual matchmaking will layer on top of this account system next.",
            );
          }}
          onCreatePrivateRoom={() => {
            setMenuMessage(null);
            if (isPending) {
              return;
            }
            if (!isAuthenticated) {
              roomClient.clearStatus();
              router.push(signInHref);
              return;
            }
            void roomClient.createPrivateRoom();
          }}
          onJoinPrivateRoom={() => {
            if (isPending) {
              return;
            }
            if (!isAuthenticated) {
              roomClient.clearStatus();
              setMenuMessage(null);
              router.push(signInHref);
              return;
            }
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

function buildSignInHref(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
) {
  const query = searchParams.toString();
  const nextPath = query ? `${pathname}?${query}` : pathname;

  return `/sign-in?next=${encodeURIComponent(nextPath)}`;
}
