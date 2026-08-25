import { rollDice } from './dice';
import { BOARD_SIZE, GRID_SIZE, type Board, type Rng, type Tile } from './types';

/** Precomputed neighbour indices for every board cell (8-way adjacency). */
export const NEIGHBORS: readonly number[][] = Array.from(
  { length: BOARD_SIZE },
  (_, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const result: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          result.push(ny * GRID_SIZE + nx);
        }
      }
    }
    return result;
  },
);

export function areAdjacent(a: Tile, b: Tile): boolean {
  return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && !(a.x === b.x && a.y === b.y);
}

/** Generates a fresh random board from the Boggle dice. */
export function generateBoard(rng: Rng = Math.random): Board {
  const faces = rollDice(rng);
  return faces.map((letter, index) => ({
    letter,
    x: index % GRID_SIZE,
    y: Math.floor(index / GRID_SIZE),
  }));
}

/**
 * Rotates the board 90 degrees clockwise. Pure: returns a new board of
 * new tiles; the input is untouched.
 */
export function rotateBoard(board: Board): Board {
  if (board.length !== BOARD_SIZE) {
    throw new Error(`Expected a ${BOARD_SIZE}-tile board`);
  }
  const rotated: Tile[] = new Array(BOARD_SIZE);
  for (const tile of board) {
    // Clockwise: column x becomes row (GRID_SIZE-1-x); row y becomes column.
    const x = GRID_SIZE - 1 - tile.y;
    const y = tile.x;
    rotated[y * GRID_SIZE + x] = { letter: tile.letter, x, y };
  }
  return rotated;
}

/**
 * Maps a point inside the board's bounding box to a tile index.
 * Pure geometry so it can be unit-tested without a DOM.
 */
export function tileIndexFromPoint(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): number | null {
  const col = Math.floor(((clientX - rect.left) / rect.width) * GRID_SIZE);
  const row = Math.floor(((clientY - rect.top) / rect.height) * GRID_SIZE);
  if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
  return row * GRID_SIZE + col;
}
