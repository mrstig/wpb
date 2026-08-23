import { describe, expect, it } from 'vitest';
import {
  clearGame,
  loadGame,
  saveGame,
  type StorageLike,
} from '../game/storage';

function memoryStorage(): StorageLike & { dump(): string } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    dump: () => JSON.stringify([...map]),
  };
}

const validGame = {
  board: Array.from({ length: 16 }, (_, i) => ({
    letter: 'A',
    x: i % 4,
    y: Math.floor(i / 4),
  })),
  score: 4,
  foundWords: ['CAT'],
};

describe('storage', () => {
  it('returns null when nothing is stored', () => {
    expect(loadGame(memoryStorage())).toBeNull();
  });

  it('round-trips a saved game', () => {
    const store = memoryStorage();
    saveGame(validGame, store);
    expect(loadGame(store)).toEqual(validGame);
  });

  it('returns null for corrupt JSON', () => {
    const store = memoryStorage();
    store.setItem('wpb.gameState.v1', '{not json');
    expect(loadGame(store)).toBeNull();
  });

  it('rejects malformed payloads', () => {
    const store = memoryStorage();
    const cases = [
      42,
      'string',
      {},
      // board wrong length
      { ...validGame, board: validGame.board.slice(0, 15) },
      // duplicate coordinates
      {
        ...validGame,
        board: validGame.board.map((t, i) => (i === 1 ? { ...t, x: 0, y: 0 } : t)),
      },
      // bad letter ('q' alone is fine — legacy saves normalize case)
      { ...validGame, board: validGame.board.map((t, i) => (i === 2 ? { ...t, letter: 'QX' } : t)) },
      // negative score
      { ...validGame, score: -1 },
      // non-integer score
      { ...validGame, score: 1.5 },
      // foundWords not strings
      { ...validGame, foundWords: [42] },
      // foundWords too short
      { ...validGame, foundWords: ['IT'] },
    ];
    for (const [i, payload] of cases.entries()) {
      store.setItem('wpb.gameState.v1', JSON.stringify(payload));
      const result = loadGame(store);
      expect(result, `case ${i}: ${JSON.stringify(payload)}`).toBeNull();
    }
  });

  it('rejects out-of-grid coordinates', () => {
    const store = memoryStorage();
    // x=15 is outside a 4-wide grid even though it is < 16.
    const bad = {
      ...validGame,
      board: validGame.board.map((t, i) => (i === 0 ? { ...t, x: 15 } : t)),
    };
    store.setItem('wpb.gameState.v1', JSON.stringify(bad));
    expect(loadGame(store)).toBeNull();
  });

  it('accepts the legacy mixed-case Qu letter spelling', () => {
    const store = memoryStorage();
    // The original app persisted letters as 'Qu'.
    const legacy = {
      board: validGame.board.map((t, i) => (i === 0 ? { ...t, letter: 'Qu' } : t)),
      score: 4,
      foundWords: ['CAT'],
    };
    store.setItem('gameState', JSON.stringify(legacy));
    expect(loadGame(store)).toEqual(legacy);
  });

  it('falls back to the legacy key and removes it on next save', () => {
    const store = memoryStorage();
    store.setItem('gameState', JSON.stringify(validGame));
    expect(loadGame(store)).toEqual(validGame);
    saveGame(validGame, store);
    expect(store.getItem('gameState')).toBeNull();
    clearGame(store);
    expect(loadGame(store)).toBeNull();
  });

  it('clearGame removes both keys and never throws when empty', () => {
    const store = memoryStorage();
    saveGame(validGame, store);
    clearGame(store);
    expect(store.getItem('wpb.gameState.v1')).toBeNull();
    expect(store.getItem('gameState')).toBeNull();
    expect(() => clearGame(store)).not.toThrow();
  });
});
