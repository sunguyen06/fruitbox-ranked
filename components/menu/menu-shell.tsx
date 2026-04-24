import Image from "next/image";
import type { ReactNode } from "react";

import { AccountMenu } from "@/components/menu/account-menu";

interface MenuShellProps {
  connectionStatus: "disabled" | "connecting" | "connected" | "disconnected" | null;
  viewer?: {
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
  contentClassName?: string;
  children: ReactNode;
}

const statusLabels = {
  disabled: "Offline",
  connecting: "Connecting",
  connected: "Online",
  disconnected: "Disconnected",
} as const;

const statusStyles = {
  disabled: "border-white/12 bg-white/[0.07] text-[#e2cfb5]",
  connecting: "border-[#ffb347]/30 bg-[#8e4f1f]/18 text-[#ffe1b2]",
  connected: "border-[#6fd68b]/28 bg-[#1d5a31]/20 text-[#c7f4d1]",
  disconnected: "border-[#ff9870]/28 bg-[#5a2a2a]/18 text-[#ffd1c0]",
} as const;

export function MenuShell({
  connectionStatus,
  viewer,
  contentClassName,
  children,
}: MenuShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1a130f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,179,71,0.16),_transparent_28%),radial-gradient(circle_at_20%_80%,_rgba(76,175,80,0.12),_transparent_25%),linear-gradient(180deg,#1a130f_0%,#231710_52%,#18110d_100%)]" />
      <div className="menu-pulse absolute left-1/2 top-[72%] h-[30rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,111,53,0.2)_0%,_rgba(255,179,71,0.1)_42%,_transparent_72%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <Decorations />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 py-5 sm:px-8 lg:px-12">
          <div className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#f2d9be] backdrop-blur">
            Fruitbox Portal
          </div>

          <div className="flex items-center gap-3">
            <AccountMenu viewer={viewer ?? null} />
            {connectionStatus ? (
              <div
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur ${statusStyles[connectionStatus]}`}
              >
                {statusLabels[connectionStatus]}
              </div>
            ) : null}
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-14 pt-4 sm:px-8 lg:px-12">
          <div className={`w-full ${contentClassName ?? "max-w-5xl"}`}>{children}</div>
        </div>
      </div>
    </main>
  );
}

function Decorations() {
  return (
    <>
      <Image
        src="/apple.png"
        alt=""
        width={60}
        height={60}
        className="menu-float pointer-events-none absolute left-[6%] top-[18%] w-[60px] opacity-[0.2] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/yellow-apple.png"
        alt=""
        width={48}
        height={48}
        className="menu-float-slow pointer-events-none absolute right-[8%] top-[24%] w-[48px] opacity-[0.18] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/green-apple.png"
        alt=""
        width={72}
        height={72}
        className="menu-float pointer-events-none absolute left-[14%] bottom-[18%] w-[72px] opacity-[0.22] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/apple.png"
        alt=""
        width={56}
        height={56}
        className="menu-float-slow pointer-events-none absolute right-[16%] bottom-[24%] w-[56px] opacity-[0.19] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />

      <Image
        src="/green-apple.png"
        alt=""
        width={74}
        height={74}
        className="menu-float pointer-events-none absolute left-[8%] top-[58%] w-[74px] opacity-[0.16] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/yellow-apple.png"
        alt=""
        width={88}
        height={88}
        className="menu-float-slow pointer-events-none absolute right-[12%] top-[64%] w-[88px] opacity-[0.14] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/apple.png"
        alt=""
        width={116}
        height={116}
        className="menu-float pointer-events-none absolute bottom-[-10px] left-[50%] w-[116px] -translate-x-[180px] opacity-82 drop-shadow-[0_24px_54px_rgba(255,111,53,0.28)]"
      />
      <Image
        src="/green-apple.png"
        alt=""
        width={132}
        height={132}
        className="menu-float-slow pointer-events-none absolute bottom-[-18px] left-[50%] w-[132px] -translate-x-[12px] opacity-90 drop-shadow-[0_24px_54px_rgba(76,175,80,0.22)]"
      />
      <Image
        src="/yellow-apple.png"
        alt=""
        width={110}
        height={110}
        className="menu-float pointer-events-none absolute bottom-[-6px] left-[50%] w-[110px] translate-x-[150px] opacity-86 drop-shadow-[0_24px_54px_rgba(255,179,0,0.2)]"
      />

      <Image
        src="/apple.png"
        alt=""
        width={52}
        height={52}
        className="menu-float pointer-events-none absolute left-[22%] top-[12%] w-[52px] opacity-[0.15] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/yellow-apple.png"
        alt=""
        width={64}
        height={64}
        className="menu-float-slow pointer-events-none absolute right-[22%] top-[16%] w-[64px] opacity-[0.17] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/green-apple.png"
        alt=""
        width={58}
        height={58}
        className="menu-float pointer-events-none absolute left-[28%] bottom-[22%] w-[58px] opacity-[0.18] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/apple.png"
        alt=""
        width={66}
        height={66}
        className="menu-float-slow pointer-events-none absolute right-[26%] bottom-[20%] w-[66px] opacity-[0.16] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/yellow-apple.png"
        alt=""
        width={50}
        height={50}
        className="menu-float pointer-events-none absolute left-[44%] top-[24%] w-[50px] opacity-[0.14] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
      <Image
        src="/green-apple.png"
        alt=""
        width={62}
        height={62}
        className="menu-float-slow pointer-events-none absolute right-[42%] bottom-[28%] w-[62px] opacity-[0.15] drop-shadow-[0_20px_40px_rgba(0,0,0,0.32)]"
      />
    </>
  );
}
