import { generateBoard, rotateBoard } from './board';
import { buildTrie } from './trie';
import { solveBoard } from './solver';
import { wordScore } from './score';
import { classifyWord, EMPTY_SELECTION, selectTile, type SelectionState } from './selection';
import type { Board, Rng, StoredGame, WordStatus } from './types';

export type Phase = 'playing' | 'confirm-finish' | 'missed-words' | 'won';

export interface Feedback {
  readonly word: string;
  readonly accepted: boolean;
  readonly seq: number;
}

export interface GameState {
  readonly phase: Phase;
  readonly board: Board;
  /** Every word reachable on the current board. */
  readonly validWords: ReadonlySet<string>;
  readonly totalWords: number;
  readonly foundWords: readonly string[];
  readonly score: number;
  readonly selection: SelectionState;
  readonly lastSubmit: Feedback | null;
  readonly notice: string | null;
}

export type GameAction =
  | { type: 'select'; index: number }
  | { type: 'release' }
  | { type: 'cancel-selection' }
  | { type: 'rotate' }
  | { type: 'ask-finish' }
  | { type: 'cancel-finish' }
  | { type: 'finish' }
  | { type: 'restart'; state: GameState }
  | { type: 'notice'; message: string }
  | { type: 'dismiss-notice' };

export function createGameState(board: Board, dictionary: Iterable<string>): GameState {
  const trie = buildTrie(dictionary);
  const validWords = solveBoard(board, trie);
  return {
    phase: 'playing',
    board,
    validWords,
    totalWords: validWords.size,
    foundWords: [],
    score: 0,
    selection: EMPTY_SELECTION,
    lastSubmit: null,
    notice: null,
  };
}

/** Fresh game with a random board. */
export function newGameState(
  dictionary: Iterable<string>,
  rng: Rng = Math.random,
): GameState {
  return createGameState(generateBoard(rng), dictionary);
}

/**
 * Rebuilds a saved game. Found words that are no longer on the board
 * (e.g. the dictionary changed between versions) are dropped so the
 * counters stay consistent.
 */
export function restoredGameState(
  saved: StoredGame,
  dictionary: Iterable<string>,
): GameState {
  const board = saved.board.map((tile) => ({
    // Legacy saves stored 'Qu'; normalize to the canonical 'QU'.
    letter: tile.letter.toUpperCase(),
    x: tile.x,
    y: tile.y,
  }));
  const state = createGameState(board, dictionary);
  const foundWords = saved.foundWords.filter((word) => state.validWords.has(word));
  const score = foundWords.reduce((sum, word) => sum + wordScore(word), 0);
  return { ...state, foundWords, score };
}

export function missedWords(state: GameState): string[] {
  return [...state.validWords]
    .filter((word) => !state.foundWords.includes(word))
    .sort();
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Gameplay is only allowed while a game is in progress; this keeps
  // captured pointers from interacting with the board behind dialogs.
  switch (action.type) {
    case 'select':
    case 'release':
    case 'cancel-selection':
    case 'rotate': {
      if (state.phase !== 'playing') return state;
      break;
    }
    case 'ask-finish': {
      if (state.phase !== 'playing') return state;
      return { ...state, phase: 'confirm-finish' };
    }
    default:
      break;
  }

  switch (action.type) {
    case 'select':
      return {
        ...state,
        selection: selectTile(state.selection, state.board, action.index),
      };

    case 'release': {
      const { selection, validWords, foundWords } = state;
      if (selection.word.length === 0) {
        return { ...state, selection: EMPTY_SELECTION };
      }
      const status: WordStatus = classifyWord(selection.word, validWords, new Set(foundWords));
      const accepted = status === 'valid';
      const nextFound = accepted ? [...foundWords, selection.word] : foundWords;
      const nextState: GameState = {
        ...state,
        foundWords: nextFound,
        score: accepted ? state.score + wordScore(selection.word) : state.score,
        selection: EMPTY_SELECTION,
        lastSubmit: {
          word: selection.word,
          accepted,
          seq: (state.lastSubmit?.seq ?? 0) + 1,
        },
      };
      if (accepted && nextFound.length === state.totalWords) {
        return { ...nextState, phase: 'won' };
      }
      return nextState;
    }

    case 'cancel-selection':
      return { ...state, selection: EMPTY_SELECTION };

    case 'rotate':
      // Rotating is a rigid motion: the set of playable words is unchanged.
      return {
        ...state,
        board: rotateBoard(state.board),
        selection: EMPTY_SELECTION,
      };

    case 'cancel-finish':
      return { ...state, phase: 'playing' };

    case 'finish':
      return { ...state, phase: 'missed-words', selection: EMPTY_SELECTION };

    case 'restart':
      return action.state;

    case 'notice':
      return { ...state, notice: action.message };

    case 'dismiss-notice':
      return { ...state, notice: null };

    default:
      return state;
  }
}
