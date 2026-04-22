"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSelectionRect = exports.getSelectedCells = void 0;
exports.normalizeSelectionRectangle = normalizeSelectionRectangle;
exports.resolveSelectionToCells = resolveSelectionToCells;
exports.sumSelectedCells = sumSelectedCells;
exports.resolveSelectionBoxToCells = resolveSelectionBoxToCells;
exports.createSelectionPreview = createSelectionPreview;
exports.clampSelectionRectangle = clampSelectionRectangle;
exports.clampGridPoint = clampGridPoint;
exports.normalizeSelectionBox = normalizeSelectionBox;
exports.createSelectionRectangleFromBox = createSelectionRectangleFromBox;
function normalizeSelectionRectangle(selectionRect) {
    const top = Math.min(selectionRect.start.row, selectionRect.end.row);
    const bottom = Math.max(selectionRect.start.row, selectionRect.end.row);
    const left = Math.min(selectionRect.start.col, selectionRect.end.col);
    const right = Math.max(selectionRect.start.col, selectionRect.end.col);
    return { top, right, bottom, left };
}
function resolveSelectionToCells(board, selectionRect) {
    var _a, _b;
    if (!selectionRect) {
        return [];
    }
    const { top, right, bottom, left } = normalizeSelectionRectangle(selectionRect);
    const selectedCells = [];
    for (let row = top; row <= bottom; row += 1) {
        for (let col = left; col <= right; col += 1) {
            const cell = (_b = (_a = board[row]) === null || _a === void 0 ? void 0 : _a[col]) !== null && _b !== void 0 ? _b : null;
            if (cell) {
                selectedCells.push(cell);
            }
        }
    }
    return selectedCells;
}
function sumSelectedCells(cells) {
    return cells.reduce((sum, cell) => sum + cell.value, 0);
}
function resolveSelectionBoxToCells(board, selectionBox) {
    var _a, _b, _c, _d;
    if (!selectionBox) {
        return [];
    }
    const normalizedBox = normalizeSelectionBox(selectionBox);
    const rows = board.length;
    const cols = (_b = (_a = board[0]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    if (rows === 0 || cols === 0) {
        return [];
    }
    const selectedCells = [];
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const cell = (_d = (_c = board[row]) === null || _c === void 0 ? void 0 : _c[col]) !== null && _d !== void 0 ? _d : null;
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
function createSelectionPreview(board, selectionBox) {
    var _a, _b;
    if (!selectionBox) {
        return null;
    }
    const normalizedBox = normalizeSelectionBox(selectionBox);
    const rows = board.length;
    const cols = (_b = (_a = board[0]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
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
function clampSelectionRectangle(selectionRect, rows, cols) {
    return {
        start: clampGridPoint(selectionRect.start, rows, cols),
        end: clampGridPoint(selectionRect.end, rows, cols),
    };
}
function clampGridPoint(point, rows, cols) {
    return {
        row: clampIndex(point.row, rows),
        col: clampIndex(point.col, cols),
    };
}
function clampIndex(value, maxExclusive) {
    return Math.min(maxExclusive - 1, Math.max(0, value));
}
exports.getSelectedCells = resolveSelectionToCells;
exports.normalizeSelectionRect = normalizeSelectionRectangle;
function normalizeSelectionBox(selectionBox) {
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
function createSelectionRectangleFromBox(selectionBox, rows, cols) {
    const normalizedBox = normalizeSelectionBox(selectionBox);
    const startCol = clampIndex(Math.floor(normalizedBox.left * cols), cols);
    const startRow = clampIndex(Math.floor(normalizedBox.top * rows), rows);
    const endCol = clampIndex(Math.ceil((normalizedBox.left + normalizedBox.width) * cols) - 1, cols);
    const endRow = clampIndex(Math.ceil((normalizedBox.top + normalizedBox.height) * rows) - 1, rows);
    return {
        start: { row: startRow, col: startCol },
        end: { row: endRow, col: endCol },
    };
}
function isCellCenterInsideSelectionBox(selectionBox, row, col, rows, cols) {
    const centerX = (col + 0.5) / cols;
    const centerY = (row + 0.5) / rows;
    const boxRight = selectionBox.left + selectionBox.width;
    const boxBottom = selectionBox.top + selectionBox.height;
    return (centerX >= selectionBox.left &&
        centerX <= boxRight &&
        centerY >= selectionBox.top &&
        centerY <= boxBottom);
}
function clampUnit(value) {
    return Math.min(1, Math.max(0, value));
}
