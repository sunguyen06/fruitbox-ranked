import type { PointerEventHandler } from "react";

import type {
  Board,
  FruitKind,
  NormalizedSelectionRect,
} from "@/lib/game/types";

type SelectionState = "idle" | "valid" | "invalid";

interface GameBoardProps {
  board: Board;
  rows: number;
  cols: number;
  selectedCellIds: Set<string>;
  selectionRect: NormalizedSelectionRect | null;
  selectionState: SelectionState;
  isInteractive: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
}

const FRUIT_THEMES: Record<
  FruitKind,
  {
    skin: string;
    glow: string;
  }
> = {
  apple: {
    skin: "border-[#ff8466] bg-[linear-gradient(180deg,#ff9b79_0%,#ff6b35_55%,#d9481a_100%)]",
    glow: "bg-white/40",
  },
  orange: {
    skin: "border-[#ffc069] bg-[linear-gradient(180deg,#ffd8a8_0%,#ff922b_52%,#f76707_100%)]",
    glow: "bg-white/35",
  },
  pear: {
    skin: "border-[#d8f5a2] bg-[linear-gradient(180deg,#efffb0_0%,#94d82d_55%,#5c940d_100%)]",
    glow: "bg-white/30",
  },
  berry: {
    skin: "border-[#ffb3f4] bg-[linear-gradient(180deg,#ffc9f7_0%,#f06595_50%,#c2255c_100%)]",
    glow: "bg-white/35",
  },
  plum: {
    skin: "border-[#d0bfff] bg-[linear-gradient(180deg,#e5dbff_0%,#9775fa_50%,#6741d9_100%)]",
    glow: "bg-white/30",
  },
  melon: {
    skin: "border-[#8ce99a] bg-[linear-gradient(180deg,#b2f2bb_0%,#38d9a9_50%,#0ca678_100%)]",
    glow: "bg-white/30",
  },
};

export function GameBoard({
  board,
  rows,
  cols,
  selectedCellIds,
  selectionRect,
  selectionState,
  isInteractive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: GameBoardProps) {
  return (
    <div className="w-full max-w-[1100px]">
      <div
        className={cx(
          "relative w-full overflow-hidden rounded-[2rem] border border-white/20 bg-[linear-gradient(180deg,#23433b_0%,#17312b_100%)] shadow-[0_24px_80px_rgba(18,26,24,0.28)] select-none touch-none",
          isInteractive ? "cursor-crosshair" : "cursor-not-allowed opacity-90",
        )}
        style={{ aspectRatio: `${cols} / ${rows}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
      >
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {board.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${rowIndex}-${colIndex}`}
                    className="border border-white/8 bg-black/10 p-1"
                  >
                    <div className="h-full w-full rounded-[0.9rem] border border-dashed border-white/8 bg-black/10" />
                  </div>
                );
              }

              const theme = FRUIT_THEMES[cell.kind];
              const isSelected = selectedCellIds.has(cell.id);

              return (
                <div key={cell.id} className="border border-white/8 bg-black/10 p-1">
                  <div
                    className={cx(
                      "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.95rem] border text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_rgba(0,0,0,0.12)] transition duration-100",
                      theme.skin,
                      isSelected && selectionState === "valid" && "scale-[0.96] ring-4 ring-emerald-300/85",
                      isSelected && selectionState === "invalid" && "scale-[0.96] ring-4 ring-rose-300/85",
                    )}
                  >
                    <div className="absolute left-[14%] top-[10%] h-[16%] w-[28%] rotate-[-30deg] rounded-full bg-[#86efac]/95 shadow-[0_0_12px_rgba(34,197,94,0.45)]" />
                    <div
                      className={cx(
                        "absolute left-[22%] top-[22%] h-[18%] w-[18%] rounded-full blur-[1px]",
                        theme.glow,
                      )}
                    />
                    <span className="relative font-mono text-[clamp(0.7rem,1.75vw,1.15rem)] font-semibold tracking-tight text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.28)]">
                      {cell.value}
                    </span>
                  </div>
                </div>
              );
            }),
          )}
        </div>

        {selectionRect ? (
          <div
            className={cx(
              "pointer-events-none absolute z-10 rounded-[1.2rem] border-4 shadow-[0_0_0_999px_rgba(5,10,18,0.08)]",
              selectionState === "valid"
                ? "border-emerald-300 bg-emerald-300/15"
                : "border-rose-300 bg-rose-300/15",
            )}
            style={{
              top: `${(selectionRect.top / rows) * 100}%`,
              left: `${(selectionRect.left / cols) * 100}%`,
              width: `${((selectionRect.right - selectionRect.left + 1) / cols) * 100}%`,
              height: `${((selectionRect.bottom - selectionRect.top + 1) / rows) * 100}%`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
