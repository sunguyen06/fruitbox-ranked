import type {
  Board,
  FruitCell,
  NormalizedSelectionRect,
  SelectionRect,
} from "@/lib/game/types";

export function normalizeSelectionRect(
  selectionRect: SelectionRect,
): NormalizedSelectionRect {
  const top = Math.min(selectionRect.start.row, selectionRect.end.row);
  const bottom = Math.max(selectionRect.start.row, selectionRect.end.row);
  const left = Math.min(selectionRect.start.col, selectionRect.end.col);
  const right = Math.max(selectionRect.start.col, selectionRect.end.col);

  return { top, right, bottom, left };
}

export function getSelectedCells(
  board: Board,
  selectionRect: SelectionRect | null,
): FruitCell[] {
  if (!selectionRect) {
    return [];
  }

  const { top, right, bottom, left } = normalizeSelectionRect(selectionRect);
  const selectedCells: FruitCell[] = [];

  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      const cell = board[row]?.[col] ?? null;

      if (cell) {
        selectedCells.push(cell);
      }
    }
  }

  return selectedCells;
}

export function sumSelectedCells(cells: FruitCell[]): number {
  return cells.reduce((sum, cell) => sum + cell.value, 0);
}
