import type {
  Board,
  FruitCell,
  GridPoint,
  NormalizedSelectionBox,
  NormalizedSelectionRect,
  SelectionPreview,
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

export function createSelectionPreview(
  board: Board,
  selectionBox: NormalizedSelectionBox | null,
): SelectionPreview | null {
  if (!selectionBox) {
    return null;
  }

  const normalizedBox = normalizeSelectionBox(selectionBox);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  if (rows === 0 || cols === 0 || normalizedBox.width === 0 || normalizedBox.height === 0) {
    return null;
  }

  const selectedCells = resolveSelectionBoxToCells(board, normalizedBox);
  const selectionRect = createSelectionRectangleFromBox(normalizedBox, rows, cols);

  return {
    selectionBox: normalizedBox,
    selectionRect,
    selectedCells,
    selectedCellIds: selectedCells.map((cell) => cell.id),
    selectedCount: selectedCells.length,
    selectedSum: sumSelectedCells(selectedCells),
  };
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

export function normalizeSelectionBox(selectionBox: NormalizedSelectionBox): NormalizedSelectionBox {
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

export function createSelectionRectangleFromBox(
  selectionBox: NormalizedSelectionBox,
  rows: number,
  cols: number,
): SelectionRect {
  const normalizedBox = normalizeSelectionBox(selectionBox);
  const startCol = clampIndex(Math.floor(normalizedBox.left * cols), cols);
  const startRow = clampIndex(Math.floor(normalizedBox.top * rows), rows);
  const endCol = clampIndex(
    Math.ceil((normalizedBox.left + normalizedBox.width) * cols) - 1,
    cols,
  );
  const endRow = clampIndex(
    Math.ceil((normalizedBox.top + normalizedBox.height) * rows) - 1,
    rows,
  );

  return {
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol },
  };
}

function isCellCenterInsideSelectionBox(
  selectionBox: NormalizedSelectionBox,
  row: number,
  col: number,
  rows: number,
  cols: number,
): boolean {
  const centerX = (col + 0.5) / cols;
  const centerY = (row + 0.5) / rows;
  const boxRight = selectionBox.left + selectionBox.width;
  const boxBottom = selectionBox.top + selectionBox.height;

  return (
    centerX >= selectionBox.left &&
    centerX <= boxRight &&
    centerY >= selectionBox.top &&
    centerY <= boxBottom
  );
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
