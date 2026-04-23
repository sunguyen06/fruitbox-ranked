"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/auth-client";

interface AccountMenuClientProps {
  viewer: {
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

export function AccountMenuClient({ viewer }: AccountMenuClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOpen = openPathname === pathname;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPathname(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  if (!viewer) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="rounded-full border border-white/12 bg-white/[0.07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f2d9be] backdrop-blur transition hover:bg-white/[0.12]"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_45px_rgba(255,143,63,0.22)] transition hover:brightness-110"
        >
          Create Account
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() =>
          setOpenPathname((current) => (current === pathname ? null : pathname))
        }
        className="flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.07] px-3 py-2 text-left backdrop-blur transition hover:bg-white/[0.12]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] text-sm font-black text-white shadow-[0_10px_28px_rgba(255,111,53,0.22)]">
          {viewer.profile.displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden sm:block">
          <span className="block max-w-[12rem] truncate text-sm font-semibold text-white">
            {viewer.profile.displayName}
          </span>
          <span className="block max-w-[12rem] truncate text-[0.65rem] uppercase tracking-[0.22em] text-[#f2d9be]">
            Account
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[320px] rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.96),rgba(30,21,15,0.98))] p-3 shadow-[0_24px_80px_rgba(5,15,12,0.35)]">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {viewer.profile.displayName}
            </p>
            <p className="truncate text-xs text-[#f0d7bc]">
              @{viewer.profile.handle}
            </p>
          </div>

          <CompactProfileForm profile={viewer.profile} />

          <button
            type="button"
            onClick={async () => {
              await signOut();
              setOpenPathname(null);
              router.replace("/");
              router.refresh();
            }}
            className="mt-3 w-full rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-left text-sm font-semibold text-[#fff0de] transition hover:bg-white/10"
          >
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CompactProfileForm({
  profile,
}: {
  profile: {
    displayName: string;
    handle: string;
    rankedRating: number;
  };
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#f0d7bc]">
        <span>Rated Seed Power</span>
        <span className="font-mono text-white">{profile.rankedRating}</span>
      </div>
    </div>
  );
}

