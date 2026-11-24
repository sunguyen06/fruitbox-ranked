import { memo } from "react";
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

              return (
                <AppleCell
                  key={cell.id}
                  value={cell.value}
                  highlight={selectedCellIds.has(cell.id) ? selectionState : "idle"}
                />
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

const AppleCell = memo(function AppleCell({ value, highlight }: {
  value: number;
  highlight: SelectionState;
}) {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-no-repeat font-mono text-2xl font-bold text-white"
      style={{
        backgroundImage: "url('/board-apples.webp')",
        backgroundSize: "300% 100%",
        backgroundPositionX: highlight === "valid" ? "50%" : highlight === "invalid" ? "100%" : "0%",
      }}
    >
      {value}
    </div>
  );
});

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
