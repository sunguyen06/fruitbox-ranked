import Image from "next/image";

interface FruitboxRankedLogoProps {
  compact?: boolean;
}

export function FruitboxRankedLogo({
  compact = false,
}: FruitboxRankedLogoProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
      <div
        className={
          compact
            ? "relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-white/15 bg-white/[0.12] shadow-[0_24px_80px_rgba(255,111,53,0.24)] backdrop-blur-xl"
            : "relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/15 bg-white/[0.12] shadow-[0_24px_100px_rgba(255,111,53,0.26)] backdrop-blur-xl"
        }
      >
        <div className="absolute inset-[6px] rounded-[inherit] bg-[radial-gradient(circle_at_top,_rgba(255,205,112,0.44),_transparent_54%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))]" />
        <Image
          src="/apple.png"
          alt="Fruitbox Ranked logo"
          width={compact ? 52 : 74}
          height={compact ? 52 : 74}
          className="relative z-10 h-auto w-auto drop-shadow-[0_10px_22px_rgba(0,0,0,0.28)]"
          priority
        />
      </div>

        <div className={compact ? "mt-5 space-y-2" : "mt-7 space-y-3"}>

        <h1
          className={
            compact
              ? "text-4xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl"
              : "text-5xl font-black uppercase tracking-[-0.06em] text-white sm:text-7xl"
          }
        >
          <span className="text-white">Fruitbox</span>
          <span className="ml-2 bg-[linear-gradient(180deg,#ffe7af_0%,#ffb347_38%,#ff6f35_100%)] bg-clip-text text-transparent">
            Ranked
          </span>
        </h1>

        <p
          className={
            compact
              ? "mx-auto max-w-2xl text-sm text-[#f1d8bb] sm:text-base"
              : "mx-auto max-w-2xl text-base text-[#f1d8bb] sm:text-xl"
          }
        >
        </p>
      </div>
    </div>
  );
}
