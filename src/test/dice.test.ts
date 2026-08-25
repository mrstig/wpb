import { describe, expect, it } from 'vitest';
import { mulberry32 } from './helpers';
import { BOGGLE_DICE, rollDice, shuffled } from '../game/dice';
import { BOARD_SIZE } from '../game/types';

describe('shuffled', () => {
  it('is deterministic for a given rng', () => {
    const a = shuffled([1, 2, 3, 4, 5], mulberry32(1));
    const b = shuffled([1, 2, 3, 4, 5], mulberry32(1));
    expect(a).toEqual(b);
  });

  it('keeps every item exactly once (permutation)', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const result = shuffled(items, Math.random);
    expect(result.slice().sort((x, y) => x - y)).toEqual(items);
    expect(result).not.toBe(items); // input not mutated
  });

  it('does not mutate the input array', () => {
    const items = [1, 2, 3];
    shuffled(items, () => 0.5);
    expect(items).toEqual([1, 2, 3]);
  });
});

describe('BOGGLE_DICE', () => {
  it('has 16 six-sided dice with uppercase letters', () => {
    expect(BOGGLE_DICE).toHaveLength(16);
    for (const die of BOGGLE_DICE) {
      expect(die).toMatch(/^[A-Z]{6}$/);
    }
  });
});

describe('rollDice', () => {
  it('returns one face per die, each from its own die', () => {
    // Pin the shuffle by seeding; faces are validated against the
    // shuffled dice using the same seed.
    for (const seed of [1, 7, 42]) {
      const dice = shuffled(BOGGLE_DICE, mulberry32(seed));
      const faces = rollDice(mulberry32(seed));
      expect(faces).toHaveLength(BOARD_SIZE);
      faces.forEach((face, i) => {
        expect(dice[i]).toContain(face === 'QU' ? 'Q' : face);
      });
    }
  });

  it('maps Q to QU and never emits a bare Q', () => {
    // Force a Q-heavy run: any occurrence of Q must be represented as QU.
    for (let i = 0; i < 200; i++) {
      const faces = rollDice();
      for (const face of faces) {
        expect(face).toMatch(/^(QU|[A-PR-Z])$/);
      }
    }
  });
});
