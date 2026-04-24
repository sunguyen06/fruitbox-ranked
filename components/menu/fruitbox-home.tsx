"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

import { useSession } from "@/lib/auth-client";
import { PrivateMatchGame } from "@/components/game/private-match-game";
import { FruitboxRankedLogo } from "@/components/menu/fruitbox-ranked-logo";
import { JoinPrivateRoomPanel } from "@/components/menu/join-private-room-panel";
import { MainMenu } from "@/components/menu/main-menu";
import { MenuShell } from "@/components/menu/menu-shell";
import { PrivateRoomLobby } from "@/components/menu/private-room-lobby";
import { PublicMatchmakingPanel } from "@/components/menu/public-matchmaking-panel";
import { useRoomClient, type QueueKind } from "@/lib/multiplayer";
import { unlockSoundEffects } from "@/lib/sound-effects";

interface FruitboxHomeProps {
  fallbackSeed?: string;
  initialViewer: {
    user: {
      name: string;
    };
    profile: {
      displayName: string;
      handle: string;
      rankedElo: number;
    };
    matchHistory: Array<{
      id: string;
      joinedAt: string;
      score: number | null;
      placement: number | null;
      didFinish: boolean;
      wasHost: boolean;
      displayNameSnapshot: string;
      handleSnapshot: string | null;
      match: {
        id: string;
        roomCode: string | null;
        seed: string;
        kind: string;
        visibility: string;
        status: string;
        completionReason: string | null;
        participantCount: number;
        createdAt: string;
        startedAt: string | null;
        finishedAt: string | null;
        participants: Array<{
          userId: string;
          displayNameSnapshot: string;
          handleSnapshot: string | null;
          score: number | null;
          placement: number | null;
        }>;
      };
    }>;
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

  async function handleQueueAgain(kind: QueueKind) {
    unlockSoundEffects();
    await roomClient.leaveCurrentRoom();
    await roomClient.joinMatchmakingQueue(kind);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleBackToHome() {
    await roomClient.leaveCurrentRoom();
    startTransition(() => {
      router.refresh();
    });
  }

  if (
    roomClient.currentRoom &&
    roomClient.userId &&
    roomClient.currentRoom.status !== "waiting"
  ) {
    return (
      <PrivateMatchGame
        room={roomClient.currentRoom}
        userId={roomClient.userId}
        isHost={roomClient.isHost && roomClient.currentRoom.kind === "private"}
        serverTimeOffsetMs={roomClient.serverTimeOffsetMs}
        statusMessage={roomClient.statusMessage}
        onLeave={roomClient.leaveCurrentRoom}
        onPlayAgain={roomClient.restartCurrentRoom}
        onQueueAgain={handleQueueAgain}
        onBackToHome={handleBackToHome}
        onSubmitSelectionBox={roomClient.submitSelectionBox}
      />
    );
  }

  if (roomClient.currentQueue && initialViewer) {
    return (
      <MenuShell connectionStatus={roomClient.connectionStatus} viewer={initialViewer}>
        <div className="flex flex-col items-center gap-8">
          <FruitboxRankedLogo compact />
          <PublicMatchmakingPanel
            queue={roomClient.currentQueue}
            rankedElo={initialViewer.profile.rankedElo}
            statusMessage={roomClient.statusMessage}
            onCancel={roomClient.leaveCurrentQueue}
          />
        </div>
      </MenuShell>
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
              unlockSoundEffects();
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
            setMenuMessage(null);
            if (isPending) {
              return;
            }
            if (!isAuthenticated) {
              roomClient.clearStatus();
              router.push(signInHref);
              return;
            }
            unlockSoundEffects();
            void roomClient.joinMatchmakingQueue("ranked");
          }}
          onFindCasual={() => {
            setMenuMessage(null);
            if (isPending) {
              return;
            }
            if (!isAuthenticated) {
              roomClient.clearStatus();
              router.push(signInHref);
              return;
            }
            unlockSoundEffects();
            void roomClient.joinMatchmakingQueue("casual");
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
            unlockSoundEffects();
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
