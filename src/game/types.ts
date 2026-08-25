export const GRID_SIZE = 4;
export const BOARD_SIZE = GRID_SIZE * GRID_SIZE;
export const MIN_WORD_LENGTH = 3;

/** A board tile. `letter` is uppercase: a single A-Z char, or 'QU'. */
export interface Tile {
  readonly letter: string;
  readonly x: number;
  readonly y: number;
}

/** A board is a row-major list of BOARD_SIZE tiles. */
export type Board = readonly Tile[];

/** Deterministic random source, e.g. a seeded PRNG in tests. */
export type Rng = () => number;

export interface StoredTile {
  letter: string;
  x: number;
  y: number;
}

export interface StoredGame {
  board: StoredTile[];
  score: number;
  foundWords: string[];
}

export type WordStatus = 'valid' | 'found' | 'invalid';
