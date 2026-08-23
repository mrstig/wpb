import { areAdjacent } from './board';
import { MIN_WORD_LENGTH, type Board, type WordStatus } from './types';

/**
 * Pure selection state machine. The path holds board indices in pick
 * order; `word` mirrors the letters picked so far ('QU' counts as two
 * characters).
 */
export interface SelectionState {
  readonly path: readonly number[];
  readonly word: string;
}

export const EMPTY_SELECTION: SelectionState = { path: [], word: '' };

/**
 * Attempts to add a tile to the selection.
 * - Tapping the last tile again is a no-op.
 * - Tapping the previous tile backtracks (undo).
 * - Tapping any other already-selected tile is ignored.
 * - Non-adjacent tiles are ignored.
 */
export function selectTile(
  state: SelectionState,
  board: Board,
  index: number,
): SelectionState {
  const { path, word } = state;
  if (index < 0 || index >= board.length) return state;

  if (path.length > 0) {
    const last = path[path.length - 1];
    if (index === last) return state;
    if (path.length >= 2 && index === path[path.length - 2]) {
      const removed = board[last].letter;
      return { path: path.slice(0, -1), word: word.slice(0, -removed.length) };
    }
    if (path.includes(index)) return state;
    if (!areAdjacent(board[index], board[last])) return state;
  }

  return { path: [...path, index], word: word + board[index].letter };
}

export function classifyWord(
  word: string,
  validWords: ReadonlySet<string>,
  foundWords: ReadonlySet<string>,
): WordStatus {
  if (word.length < MIN_WORD_LENGTH || !validWords.has(word)) {
    return 'invalid';
  }
  return foundWords.has(word) ? 'found' : 'valid';
}
