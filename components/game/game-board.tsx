import Image from "next/image";
import type { PointerEventHandler } from "react";

import type { Board } from "@/lib/game";

type SelectionState = "idle" | "valid" | "invalid";

interface GameBoardProps {
  board: Board;
  rows: number;
  cols: number;
  selectedCellIds: Set<string>;
  visualSelectionRect: { top: number; left: number; width: number; height: number } | null;
  selectionState: SelectionState;
  isInteractive: boolean;
  showDisabledState?: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
}

export function GameBoard({
  board,
  rows,
  cols,
  selectedCellIds,
  visualSelectionRect,
  selectionState,
  isInteractive,
  showDisabledState = true,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: GameBoardProps) {
  return (
    <div className="w-full max-w-[1100px]">
      <div
        className={cx(
          "relative w-full overflow-hidden rounded-lg border-4 border-yellow-600 select-none touch-none",
          isInteractive
            ? "cursor-crosshair"
            : showDisabledState
              ? "cursor-not-allowed opacity-90"
              : "cursor-crosshair",
        )}
        style={{
          aspectRatio: `${cols} / ${rows}`,
          background: "linear-gradient(to right, #c3f0c9 0%, #c3f0c9 100%)",
        }}
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
                    className="h-full w-full"
                  />
                );
              }

              const isSelected = selectedCellIds.has(cell.id);
              const appleImage = isSelected
                ? selectionState === "valid"
                  ? "/green-apple.png"
                  : "/yellow-apple.png"
                : "/apple.png";

              return (
                <div key={cell.id} className="h-full w-full">
                  <div
                    className={cx(
                      "relative flex h-full w-full items-center justify-center overflow-hidden transition duration-100",
                    )}
                  >
                    <Image
                      src={appleImage}
                      alt="apple"
                      fill
                      sizes="(max-width: 1100px) 100vw, 1100px"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="relative z-10 font-mono text-2xl font-bold text-white">
                      {cell.value}
                    </span>
                  </div>
                </div>
              );
            }),
          )}
        </div>

        {visualSelectionRect ? (
          <div
            className={cx(
              "pointer-events-none absolute z-10 border-[2px]",
              selectionState === "valid"
                ? "border-green-500 bg-green-300/50"
                : "border-yellow-500 bg-yellow-300/50",
            )}
            style={{
              top: `${visualSelectionRect.top * 100}%`,
              left: `${visualSelectionRect.left * 100}%`,
              width: `${visualSelectionRect.width * 100}%`,
              height: `${visualSelectionRect.height * 100}%`,
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
