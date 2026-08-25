import type { Rng } from '../game/types';

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Always picks index 0 — useful to force worst-case shuffles.
 */
export const zeroRng: Rng = () => 0;

/**
 * Builds a board row-major from letters ('A'-'Z' or 'QU').
 * Letters are read row by row, e.g. rows of 4.
 */
export function boardFromRows(rows: string[]): import('../game/types').Board {
  const letters = rows.flatMap((row) => row.trim().split(/\s+/));
  return letters.map((letter, index) => ({
    letter,
    x: index % 4,
    y: Math.floor(index / 4),
  }));
}
