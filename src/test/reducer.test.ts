import { describe, expect, it } from 'vitest';
import {
  createGameState,
  gameReducer,
  missedWords,
  newGameState,
  restoredGameState,
} from '../game/reducer';
import { getDictionaryWords } from '../game/dictionary';
import type { StoredGame } from '../game/types';
import { boardFromRows, mulberry32 } from './helpers';

const DICT = ['CAT', 'CATS', 'QUIT'];

// Board:
//   C A T S
//   E F G H
//   I J K L
//   QU I T M
const BOARD = boardFromRows(['C A T S', 'E F G H', 'I J K L', 'QU I T M']);

function playing() {
  return createGameState(BOARD, DICT);
}

function select(state: ReturnType<typeof playing>, indices: number[]) {
  return indices.reduce(
    (acc, index) => gameReducer(acc, { type: 'select', index }),
    state,
  );
}

describe('createGameState / newGameState', () => {
  it('solves the board and exposes totals', () => {
    const state = playing();
    expect(state.phase).toBe('playing');
    expect(state.totalWords).toBe(state.validWords.size);
    // Row 0 is C A T S: CAT and CATS are both traceable.
    // Bottom row spells Q U I T via the QU tile + I + T.
    for (const word of ['CAT', 'CATS', 'QUIT']) {
      expect(state.validWords.has(word)).toBe(true);
    }
    expect(state.totalWords).toBe(3);
  });

  it('generates random boards with a seeded rng and solves them', () => {
    const dictionary = getDictionaryWords();
    const a = newGameState(dictionary, mulberry32(11));
    const b = newGameState(dictionary, mulberry32(11));
    expect(a.board).toEqual(b.board);
    // Any random board over the full dictionary yields many words.
    expect(a.totalWords).toBeGreaterThan(20);
  });
});

describe('word submission (release)', () => {
  it('accepts a valid word: records, scores, resets selection', () => {
    let state = select(playing(), [0, 1, 2]); // CAT
    const before = state.score;
    state = gameReducer(state, { type: 'release' });

    expect(state.foundWords).toEqual(['CAT']);
    expect(state.score).toBe(before + 1);
    expect(state.selection.word).toBe('');
    expect(state.lastSubmit).toMatchObject({ word: 'CAT', accepted: true });
    expect(state.phase).toBe('playing');
  });

  it('rejects invalid words without scoring', () => {
    let state = select(playing(), [0, 1, 4]); // C A E — not a word
    state = gameReducer(state, { type: 'release' });
    expect(state.foundWords).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.lastSubmit).toMatchObject({ word: 'CAE', accepted: false });
  });

  it('rejects already-found words exactly once', () => {
    let state = select(playing(), [0, 1, 2]);
    state = gameReducer(state, { type: 'release' }); // CAT ok
    state = select(state, [0, 1, 2]);
    state = gameReducer(state, { type: 'release' }); // CAT again
    expect(state.foundWords.filter((w) => w === 'CAT')).toHaveLength(1);
    expect(state.score).toBe(1);
    expect(state.lastSubmit?.accepted).toBe(false);
  });

  it('scores by written length with boggle rules', () => {
    // Bottom row spells Q U I T via tiles 12..14.
    let state = select(playing(), [12, 13, 14]);
    state = gameReducer(state, { type: 'release' });
    expect(state.foundWords).toContain('QUIT');
    expect(state.score).toBe(1); // 4 written characters -> 1 point
  });

  it('transitions to won when every word is found', () => {
    const tiny = createGameState(
      boardFromRows(['C A T .', '. . . .', '. . . .', '. . . .']),
      ['CAT'],
    );
    let state = select(tiny, [0, 1, 2]);
    state = gameReducer(state, { type: 'release' });
    expect(state.phase).toBe('won');
    expect(state.foundWords).toHaveLength(state.totalWords);
  });

  it('releasing an empty selection just clears it', () => {
    const state = gameReducer(playing(), { type: 'release' });
    expect(state.selection.word).toBe('');
    expect(state.lastSubmit).toBeNull();
  });
});

describe('selection lifecycle', () => {
  it('cancel-selection clears the current word', () => {
    let state = select(playing(), [0, 1]);
    state = gameReducer(state, { type: 'cancel-selection' });
    expect(state.selection.word).toBe('');
    expect(state.foundWords).toEqual([]);
  });
});

describe('rotate', () => {
  it('rotates the board, resets the selection and keeps totals', () => {
    const initial = playing();
    let state = select(initial, [0, 1, 2]);
    state = gameReducer(state, { type: 'rotate' });

    expect(state.totalWords).toBe(initial.totalWords);
    expect(state.validWords).toBe(initial.validWords); // rotation-invariant set reused
    expect(state.selection.word).toBe('');

    // Letters preserved as a multiset.
    const sortLetters = (b: typeof state.board) =>
      b.map((t) => t.letter).sort().join(',');
    expect(sortLetters(state.board)).toBe(sortLetters(initial.board));
  });
});

describe('finish flow', () => {
  it('asks for confirmation, can cancel, then shows missed words', () => {
    let state = playing();
    state = gameReducer(state, { type: 'ask-finish' });
    expect(state.phase).toBe('confirm-finish');

    state = gameReducer(state, { type: 'cancel-finish' });
    expect(state.phase).toBe('playing');

    state = gameReducer(state, { type: 'ask-finish' });
    state = gameReducer(state, { type: 'finish' });
    expect(state.phase).toBe('missed-words');
  });

  it('keeps the in-progress word while the confirm dialog is open', () => {
    let state = select(playing(), [0, 1, 2]); // CAT mid-drag
    state = gameReducer(state, { type: 'ask-finish' });
    expect(state.selection.word).toBe('CAT');
    state = gameReducer(state, { type: 'cancel-finish' });
    expect(state.phase).toBe('playing');
    expect(state.selection.word).toBe('CAT');
  });

  it('ignores gameplay actions once a game has ended', () => {
    let state = gameReducer(playing(), { type: 'finish' });

    // A captured pointer could keep delivering events behind dialogs.
    state = select(state, [0, 1, 2]);
    expect(state.selection.word).toBe('');
    state = gameReducer(state, { type: 'release' });
    expect(state.foundWords).toEqual([]);
    state = gameReducer(state, { type: 'rotate' });
    expect(state.board).toEqual(BOARD);

    // Finishing again is a no-op too.
    const before = state;
    state = gameReducer(state, { type: 'ask-finish' });
    expect(state).toBe(before);
  });

  it('missed words are sorted and exclude found ones', () => {
    let state = select(playing(), [0, 1, 2]);
    state = gameReducer(state, { type: 'release' }); // CAT found
    const missed = missedWords(state);
    expect(missed).toEqual([...missed].sort());
    expect(missed).not.toContain('CAT');
    expect(missed.length + state.foundWords.length).toBe(state.totalWords);
  });
});

describe('restart & notices', () => {
  it('restart swaps in the provided fresh state', () => {
    const finished = gameReducer(playing(), { type: 'finish' });
    const fresh = newGameState(DICT, mulberry32(2));
    const state = gameReducer(finished, { type: 'restart', state: fresh });
    expect(state).toBe(fresh);
    expect(state.foundWords).toEqual([]);
    expect(state.phase).toBe('playing');
  });

  it('notice can be set and dismissed', () => {
    let state = gameReducer(playing(), { type: 'notice', message: 'Thanks!' });
    expect(state.notice).toBe('Thanks!');
    state = gameReducer(state, { type: 'dismiss-notice' });
    expect(state.notice).toBeNull();
  });
});

describe('restoredGameState', () => {
  it('restores score and words from storage', () => {
    const saved: StoredGame = {
      board: BOARD.map(({ letter, x, y }) => ({ letter, x, y })),
      score: 2,
      foundWords: ['CAT', 'CATS'],
    };
    const state = restoredGameState(saved, DICT);
    expect(state.foundWords).toEqual(['CAT', 'CATS']);
    expect(state.score).toBe(2); // recomputed: 1 + 1
    expect(state.totalWords).toBeGreaterThan(0);
  });

  it('normalizes legacy mixed-case Qu letters', () => {
    const legacyBoard = BOARD.map(({ letter, x, y }) =>
      x === 0 && y === 3 ? { letter: 'Qu', x, y } : { letter, x, y },
    );
    // Legacy board spells QUIT via 'Qu' + I + T on the bottom row.
    const saved: StoredGame = {
      board: legacyBoard,
      score: 1,
      foundWords: [],
    };
    const state = restoredGameState(saved, ['QUIT']);
    expect(state.board.find((t) => t.x === 0 && t.y === 3)?.letter).toBe('QU');
    expect(state.validWords.has('QUIT')).toBe(true);
  });

  it('drops stale words no longer on the board and fixes the score', () => {
    const saved: StoredGame = {
      board: BOARD.map(({ letter, x, y }) => ({ letter, x, y })),
      score: 99, // corrupt/legacy value
      foundWords: ['CAT', 'ZZZQQQ'], // ZZZQQQ unreachable on this board
    };
    const state = restoredGameState(saved, DICT);
    expect(state.foundWords).toEqual(['CAT']);
    expect(state.score).toBe(1);
  });
});
