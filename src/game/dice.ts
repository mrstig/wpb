import { BOARD_SIZE, type Rng } from './types';

/** The classic Boggle 4x4 dice set. */
export const BOGGLE_DICE: readonly string[] = [
  'AAEEGN',
  'ABBJOO',
  'ACHOPS',
  'AFFKPS',
  'AOOTTW',
  'CIMOTU',
  'DEILRX',
  'DELRVY',
  'DISTTY',
  'EEGHNW',
  'EEINSU',
  'EHRTVW',
  'EIOSST',
  'ELRTTY',
  'HIMNQU',
  'HLNNRZ',
];

/** Fisher-Yates shuffle. Returns a new array; the input is not mutated. */
export function shuffled<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Rolls every die once (dice are first shuffled so each die is used
 * exactly once) and returns BOARD_SIZE uppercase faces.
 * A rolled Q becomes 'QU'.
 */
export function rollDice(rng: Rng = Math.random): string[] {
  const dice = shuffled(BOGGLE_DICE, rng);
  const faces: string[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    const die = dice[i];
    const face = die[Math.floor(rng() * die.length)];
    faces.push(face === 'Q' ? 'QU' : face);
  }
  return faces;
}
