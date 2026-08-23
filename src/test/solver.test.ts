import { describe, expect, it } from 'vitest';
import { solveBoard } from '../game/solver';
import { buildTrie } from '../game/trie';
import { boardFromRows } from './helpers';

describe('solveBoard', () => {
  it('finds words along a straight row', () => {
    const board = boardFromRows([
      'C A T Z',
      '. . . .',
      '. . . .',
      '. . . .',
    ]);
    // '.' is not a letter in any dictionary we use here.
    const words = solveBoard(board, buildTrie(['CAT', 'AT']));
    expect(words.has('CAT')).toBe(true);
  });

  it('enforces the minimum length', () => {
    const board = boardFromRows([
      'C A T Z',
      '. . . .',
      '. . . .',
      '. . . .',
    ]);
    const words = solveBoard(board, buildTrie(['AT', 'CAT']));
    expect(words.has('AT')).toBe(false);
    expect(words.has('CAT')).toBe(true);
  });

  it('does not reuse tiles: AAA needs three distinct A tiles', () => {
    const twoAs = boardFromRows([
      'A A . .',
      '. . . .',
      '. . . .',
      '. . . .',
    ]);
    const threeAs = boardFromRows([
      'A A . .',
      'A . . .',
      '. . . .',
      '. . . .',
    ]);
    expect(solveBoard(twoAs, buildTrie(['AAA'])).has('AAA')).toBe(false);
    expect(solveBoard(threeAs, buildTrie(['AAA'])).has('AAA')).toBe(true);
  });

  it('walks QU as Q then U through the trie but reports one tile', () => {
    // Bottom row: QU I T A — QUIT uses three tiles (QU, I, T).
    const board = boardFromRows([
      '. . . .',
      '. . . .',
      '. . . .',
      'QU I T A',
    ]);
    const words = solveBoard(board, buildTrie(['QUIT']));
    expect(words.has('QUIT')).toBe(true);
    expect(solveBoard(board, buildTrie([])).size).toBe(0);
  });

  it('requires adjacency between consecutive tiles', () => {
    // C and A are separated by a full cell: CAT impossible.
    const board = boardFromRows([
      'C . T .',
      '. . . .',
      'A . . .',
      '. . . .',
    ]);
    const words = solveBoard(board, buildTrie(['CAT']));
    expect(words.has('CAT')).toBe(false);
  });

  it('deduplicates words reachable via multiple paths', () => {
    const board = boardFromRows([
      'C C C .',
      'A A A .',
      'T T T .',
      '. . . .',
    ]);
    const words = solveBoard(board, buildTrie(['CAT']));
    expect([...words].filter((w) => w === 'CAT')).toHaveLength(1);
  });

  it('returns an empty set for an empty dictionary', () => {
    const board = boardFromRows(['A B C D', 'E F G H', 'I J K L', 'M N O P']);
    expect(solveBoard(board, buildTrie([])).size).toBe(0);
  });
});
