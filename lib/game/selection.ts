import type {
  Board,
  FruitCell,
  GridPoint,
  NormalizedSelectionBox,
  NormalizedSelectionRect,
  SelectionRect,
} from "./types";

export function normalizeSelectionRectangle(
  selectionRect: SelectionRect,
): NormalizedSelectionRect {
  const top = Math.min(selectionRect.start.row, selectionRect.end.row);
  const bottom = Math.max(selectionRect.start.row, selectionRect.end.row);
  const left = Math.min(selectionRect.start.col, selectionRect.end.col);
  const right = Math.max(selectionRect.start.col, selectionRect.end.col);

  return { top, right, bottom, left };
}

export function resolveSelectionToCells(
  board: Board,
  selectionRect: SelectionRect | null,
): FruitCell[] {
  if (!selectionRect) {
    return [];
  }

  const { top, right, bottom, left } = normalizeSelectionRectangle(selectionRect);
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

export function resolveSelectionBoxToCells(
  board: Board,
  selectionBox: NormalizedSelectionBox | null,
): FruitCell[] {
  if (!selectionBox) {
    return [];
  }

  const normalizedBox = normalizeSelectionBox(selectionBox);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  if (rows === 0 || cols === 0) {
    return [];
  }

  const selectedCells: FruitCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = board[row]?.[col] ?? null;

      if (!cell) {
        continue;
      }

      if (isCellCenterInsideSelectionBox(normalizedBox, row, col, rows, cols)) {
        selectedCells.push(cell);
      }
    }
  }

  return selectedCells;
}

export function clampSelectionRectangle(
  selectionRect: SelectionRect,
  rows: number,
  cols: number,
): SelectionRect {
  return {
    start: clampGridPoint(selectionRect.start, rows, cols),
    end: clampGridPoint(selectionRect.end, rows, cols),
  };
}

export function clampGridPoint(point: GridPoint, rows: number, cols: number): GridPoint {
  return {
    row: clampIndex(point.row, rows),
    col: clampIndex(point.col, cols),
  };
}

function clampIndex(value: number, maxExclusive: number): number {
  return Math.min(maxExclusive - 1, Math.max(0, value));
}

export const getSelectedCells = resolveSelectionToCells;
export const normalizeSelectionRect = normalizeSelectionRectangle;

function normalizeSelectionBox(selectionBox: NormalizedSelectionBox): NormalizedSelectionBox {
  const left = clampUnit(selectionBox.left);
  const top = clampUnit(selectionBox.top);
  const right = clampUnit(selectionBox.left + selectionBox.width);
  const bottom = clampUnit(selectionBox.top + selectionBox.height);

  return {
    top: Math.min(top, bottom),
    left: Math.min(left, right),
    width: Math.abs(right - left),
    height: Math.abs(bottom - top),
  };
}

function isCellCenterInsideSelectionBox(
  selectionBox: NormalizedSelectionBox,
  row: number,
  col: number,
  rows: number,
  cols: number,
): boolean {
  // Define center box as 30% of cell area (35% inset from each edge)
  const cellLeft = col / cols;
  const cellRight = (col + 1) / cols;
  const cellTop = row / rows;
  const cellBottom = (row + 1) / rows;

  const cellWidth = cellRight - cellLeft;
  const cellHeight = cellBottom - cellTop;

  const centerBoxLeft = cellLeft + cellWidth * 0.35;
  const centerBoxRight = cellLeft + cellWidth * 0.65;
  const centerBoxTop = cellTop + cellHeight * 0.35;
  const centerBoxBottom = cellTop + cellHeight * 0.65;

  const boxRight = selectionBox.left + selectionBox.width;
  const boxBottom = selectionBox.top + selectionBox.height;

  // Check for overlap between center box and selection box
  return (
    centerBoxLeft < boxRight &&
    centerBoxRight > selectionBox.left &&
    centerBoxTop < boxBottom &&
    centerBoxBottom > selectionBox.top
  );
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
