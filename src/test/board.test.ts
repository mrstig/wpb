import { describe, expect, it } from 'vitest';
import {
  areAdjacent,
  generateBoard,
  NEIGHBORS,
  rotateBoard,
  tileIndexFromPoint,
} from '../game/board';
import { boardFromRows, mulberry32, zeroRng } from './helpers';
import { BOARD_SIZE, GRID_SIZE, type Board } from '../game/types';

function letterAt(board: Board, x: number, y: number): string {
  const tile = board.find((t) => t.x === x && t.y === y);
  if (!tile) throw new Error(`no tile at ${x},${y}`);
  return tile.letter;
}

describe('generateBoard', () => {
  it('creates a 4x4 board with correct coordinates', () => {
    const board = generateBoard(mulberry32(5));
    expect(board).toHaveLength(BOARD_SIZE);
    board.forEach((tile, index) => {
      expect(tile.x).toBe(index % GRID_SIZE);
      expect(tile.y).toBe(Math.floor(index / GRID_SIZE));
      expect(tile.letter).toMatch(/^(QU|[A-Z])$/);
    });
  });

  it('is deterministic for a seeded rng', () => {
    expect(generateBoard(mulberry32(9))).toEqual(generateBoard(mulberry32(9)));
  });

  it('produces different boards across seeds', () => {
    const boards = new Set(
      [1, 2, 3, 4, 5]
        .map((seed) => generateBoard(mulberry32(seed)).map((t) => t.letter).join(','))
    );
    expect(boards.size).toBeGreaterThan(1);
  });

  it('tolerates a degenerate rng', () => {
    expect(generateBoard(zeroRng)).toHaveLength(BOARD_SIZE);
  });
});

describe('NEIGHBORS', () => {
  it('gives corners 3, edges 5 and centres 8 neighbours', () => {
    expect(NEIGHBORS[0]).toHaveLength(3);
    expect(NEIGHBORS[3]).toHaveLength(3);
    expect(NEIGHBORS[15]).toHaveLength(3);
    expect(NEIGHBORS[1]).toHaveLength(5);
    expect(NEIGHBORS[4]).toHaveLength(5);
    expect(NEIGHBORS[5]).toHaveLength(8);
    expect(NEIGHBORS[10]).toHaveLength(8);
  });

  it('only contains in-bounds indices, no self, no duplicates', () => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (const n of NEIGHBORS[i]) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(BOARD_SIZE);
        expect(n).not.toBe(i);
      }
      expect(new Set(NEIGHBORS[i]).size).toBe(NEIGHBORS[i].length);
    }
  });
});

describe('areAdjacent', () => {
  const tile = (x: number, y: number) => ({ letter: 'A', x, y });

  it('accepts orthogonal and diagonal steps', () => {
    expect(areAdjacent(tile(0, 0), tile(1, 0))).toBe(true);
    expect(areAdjacent(tile(0, 0), tile(0, 1))).toBe(true);
    expect(areAdjacent(tile(0, 0), tile(1, 1))).toBe(true);
  });

  it('rejects distance > 1 and identical cells', () => {
    expect(areAdjacent(tile(0, 0), tile(2, 0))).toBe(false);
    expect(areAdjacent(tile(0, 0), tile(0, 2))).toBe(false);
    expect(areAdjacent(tile(0, 0), tile(3, 3))).toBe(false);
    expect(areAdjacent(tile(2, 2), tile(2, 2))).toBe(false);
  });
});

describe('rotateBoard', () => {
  // A B C D          M I E A
  // E F G H   --CW-> N J F B
  // I J K L          O K G C
  // M N O P          P L H D
  const board = boardFromRows(['A B C D', 'E F G H', 'I J K L', 'M N O P']);

  it('rotates clockwise once', () => {
    const rotated = rotateBoard(board);
    expect(letterAt(rotated, 0, 0)).toBe('M');
    expect(letterAt(rotated, 1, 0)).toBe('I');
    expect(letterAt(rotated, 2, 0)).toBe('E');
    expect(letterAt(rotated, 3, 0)).toBe('A');
    expect(letterAt(rotated, 0, 1)).toBe('N');
    expect(letterAt(rotated, 1, 1)).toBe('J');
    expect(letterAt(rotated, 3, 3)).toBe('D');
  });

  it('is cyclic: four rotations restore the original arrangement', () => {
    let current = board;
    for (let i = 0; i < 4; i++) current = rotateBoard(current);
    const key = (b: Board) => b.map((t) => `${t.letter}@${t.x},${t.y}`).join('|');
    expect(key(current)).toBe(key(board));
  });

  it('does not mutate the input', () => {
    const snapshot = JSON.stringify(board);
    rotateBoard(board);
    expect(JSON.stringify(board)).toBe(snapshot);
  });

  it('rejects malformed boards', () => {
    expect(() => rotateBoard([])).toThrow();
  });
});

describe('tileIndexFromPoint', () => {
  const rect = { left: 10, top: 20, width: 400, height: 400 };

  it('maps cell centres to indices', () => {
    expect(tileIndexFromPoint(rect, 60, 70)).toBe(0);
    expect(tileIndexFromPoint(rect, 160, 70)).toBe(1);
    expect(tileIndexFromPoint(rect, 60, 170)).toBe(4);
    expect(tileIndexFromPoint(rect, 360, 370)).toBe(15);
  });

  it('returns null outside the rect', () => {
    expect(tileIndexFromPoint(rect, 5, 25)).toBeNull();
    expect(tileIndexFromPoint(rect, 411, 100)).toBeNull();
    expect(tileIndexFromPoint(rect, 100, 19)).toBeNull();
  });
});
