import { describe, expect, it } from 'vitest';
import { classifyWord, EMPTY_SELECTION, selectTile } from '../game/selection';
import { boardFromRows } from './helpers';

// Row 3 of the board: index 12='QU' 13='I' 14='T' 15='X'
const board = boardFromRows(['. . . .', '. . . .', '. . . .', 'QU I T X']);

describe('selectTile', () => {
  it('starts a selection on any tile', () => {
    const next = selectTile(EMPTY_SELECTION, board, 12);
    expect(next.path).toEqual([12]);
    expect(next.word).toBe('QU');
  });

  it('appends adjacent tiles and accumulates letters', () => {
    let s = selectTile(EMPTY_SELECTION, board, 12);
    s = selectTile(s, board, 13);
    s = selectTile(s, board, 14);
    expect(s.path).toEqual([12, 13, 14]);
    expect(s.word).toBe('QUIT');
  });

  it('ignores non-adjacent tiles', () => {
    let s = selectTile(EMPTY_SELECTION, board, 0);
    s = selectTile(s, board, 15);
    expect(s.path).toEqual([0]);
  });

  it('tapping the last tile again returns the same state', () => {
    const s = selectTile(EMPTY_SELECTION, board, 12);
    expect(selectTile(s, board, 12)).toBe(s);
  });

  it('backtracks when tapping the previous tile', () => {
    let s = selectTile(EMPTY_SELECTION, board, 13); // 'I'
    s = selectTile(s, board, 14); // 'T'
    s = selectTile(s, board, 13); // undo 'T'
    expect(s.path).toEqual([13]);
    expect(s.word).toBe('I');
  });

  it('backtracking past a QU tile removes both characters', () => {
    let s = selectTile(EMPTY_SELECTION, board, 13); // 'I'
    s = selectTile(s, board, 12); // 'QU' -> 'IQU'
    expect(s.word).toBe('IQU');
    s = selectTile(s, board, 13); // undo the whole QU tile
    expect(s.path).toEqual([13]);
    expect(s.word).toBe('I');
  });

  it('ignores other already-selected tiles', () => {
    let s = selectTile(EMPTY_SELECTION, board, 12);
    s = selectTile(s, board, 13);
    s = selectTile(s, board, 14);
    s = selectTile(s, board, 12); // first tile: neither last nor previous
    expect(s.path).toEqual([12, 13, 14]);
    expect(s.word).toBe('QUIT');
  });

  it('ignores out-of-range indices', () => {
    expect(selectTile(EMPTY_SELECTION, board, -1)).toBe(EMPTY_SELECTION);
    expect(selectTile(EMPTY_SELECTION, board, 16)).toBe(EMPTY_SELECTION);
  });
});

describe('classifyWord', () => {
  const valid = new Set(['CAT', 'QUIT']);
  const found = new Set<string>(['DOG']);

  it('classifies unknown words as invalid', () => {
    expect(classifyWord('XYZ', valid, found)).toBe('invalid');
  });

  it('classifies short words as invalid regardless', () => {
    expect(classifyWord('AT', valid, found)).toBe('invalid');
    expect(classifyWord('', valid, found)).toBe('invalid');
  });

  it('classifies reachable unfound words as valid', () => {
    expect(classifyWord('CAT', valid, found)).toBe('valid');
  });

  it('classifies already found words as found', () => {
    expect(classifyWord('QUIT', valid, new Set([...found, 'QUIT']))).toBe('found');
  });
});
