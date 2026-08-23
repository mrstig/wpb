import { describe, expect, it } from 'vitest';
import { isLongEnough, wordScore } from '../game/score';

describe('wordScore', () => {
  it.each([
    ['CAT', 1],
    ['WORD', 1], // 4 letters
    ['SCORE', 2], // 5
    ['BOGGLE', 3], // 6
    ['SEVENTH', 5], // 7
    ['EIGHTLETTER', 11], // 8+
    ['QUITTINGLONG', 11],
  ])('%s scores %i', (word, expected) => {
    expect(wordScore(word)).toBe(expected);
  });

  it('counts QU as two letters', () => {
    // 'QUAY' is 4 written characters -> 1 point.
    expect(wordScore('QUAY')).toBe(1);
  });
});

describe('isLongEnough', () => {
  it('accepts 3+ and rejects shorter', () => {
    expect(isLongEnough('CAT')).toBe(true);
    expect(isLongEnough('IT')).toBe(false);
    expect(isLongEnough('')).toBe(false);
  });
});
