import { MIN_WORD_LENGTH, type Board } from './types';
import type { TrieNode } from './trie';
import { NEIGHBORS } from './board';

/**
 * Finds every dictionary word that can be traced on the board by moving
 * between 8-way adjacent tiles without reusing a tile. 'QU' consumes one
 * tile but walks both trie edges.
 */
export function solveBoard(
  board: Board,
  root: TrieNode,
  minLength: number = MIN_WORD_LENGTH,
): Set<string> {
  const results = new Set<string>();
  const visited = new Array<boolean>(board.length).fill(false);

  const step = (index: number, node: TrieNode, prefix: string): void => {
    if (visited[index]) return;

    let next: TrieNode | undefined = node;
    for (const char of board[index].letter) {
      next = next.children.get(char);
      if (!next) return;
    }

    const word = prefix + board[index].letter;
    if (word.length >= minLength && next.isWord) {
      results.add(word);
    }

    visited[index] = true;
    for (const neighbor of NEIGHBORS[index]) {
      step(neighbor, next, word);
    }
    visited[index] = false;
  };

  for (let i = 0; i < board.length; i++) {
    step(i, root, '');
  }
  return results;
}
