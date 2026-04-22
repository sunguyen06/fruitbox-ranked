"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBoard = generateBoard;
exports.cloneBoard = cloneBoard;
const rng_1 = require("./rng");
function generateBoard(config) {
    const rng = (0, rng_1.createSeededRng)(`${config.seed}:${config.rows}x${config.cols}`);
    return Array.from({ length: config.rows }, (_, row) => Array.from({ length: config.cols }, (_, col) => createFruitCell(rng, config, row, col)));
}
function cloneBoard(board) {
    return board.map((row) => [...row]);
}
function createFruitCell(rng, config, row, col) {
    return {
        id: `${config.seed}-${row}-${col}-${Math.floor(rng() * 1000000000).toString(36)}`,
        kind: (0, rng_1.pickOne)(rng, config.fruitKinds),
        value: (0, rng_1.randomInt)(rng, config.minFruitValue, config.maxFruitValue),
        row,
        col,
    };
}
