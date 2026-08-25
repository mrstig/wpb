import { describe, expect, it } from 'vitest';
import { buildTrie, createTrieNode, hasWord, walk } from '../game/trie';

describe('buildTrie / hasWord', () => {
  const trie = buildTrie(['CAT', 'CATS', 'QUIT', 'CAST']);

  it('finds inserted words', () => {
    expect(hasWord(trie, 'CAT')).toBe(true);
    expect(hasWord(trie, 'CATS')).toBe(true);
    expect(hasWord(trie, 'QUIT')).toBe(true);
  });

  it('rejects prefixes that are not words', () => {
    expect(hasWord(trie, 'CA')).toBe(false);
    expect(hasWord(trie, 'QU')).toBe(false);
  });

  it('rejects extensions and unknown words', () => {
    expect(hasWord(trie, 'CATSX')).toBe(false);
    expect(hasWord(trie, 'DOG')).toBe(false);
  });

  it('is case-insensitive on lookup', () => {
    expect(hasWord(trie, 'cat')).toBe(true);
    expect(hasWord(trie, 'quit')).toBe(true);
  });

  it('handles an empty word list', () => {
    const empty = buildTrie([]);
    expect(hasWord(empty, 'A')).toBe(false);
  });

  it('ignores duplicate inserts', () => {
    const t = buildTrie(['CAT', 'CAT']);
    expect(hasWord(t, 'CAT')).toBe(true);
  });
});

describe('walk', () => {
  it('returns the node at the end of a prefix', () => {
    const trie = buildTrie(['DOG']);
    expect(walk(trie, 'DO')?.isWord).toBe(false);
    expect(walk(trie, 'DOG')?.isWord).toBe(true);
  });

  it('returns undefined past the trie', () => {
    const trie = buildTrie(['DOG']);
    expect(walk(trie, 'DON')).toBeUndefined();
  });

  it('returns the root for an empty prefix', () => {
    const root = createTrieNode();
    expect(walk(root, '')).toBe(root);
  });
});
