import rawWords from '../data/words.txt?raw';
import { buildTrie, type TrieNode } from './trie';

/** Parses raw dictionary text into clean uppercase words (>= 3 letters). */
export function parseWords(text: string): string[] {
  const words = new Set<string>();
  for (const line of text.split('\n')) {
    const word = line.trim().toUpperCase();
    if (/^[A-Z]{3,}$/.test(word)) {
      words.add(word);
    }
  }
  return [...words].sort();
}

let cachedWords: readonly string[] | null = null;
let cachedTrie: TrieNode | null = null;

/** The bundled dictionary words, parsed once on first use. */
export function getDictionaryWords(): readonly string[] {
  cachedWords ??= parseWords(rawWords);
  return cachedWords;
}

/** A trie over the bundled dictionary, built once on first use. */
export function getDictionaryTrie(): TrieNode {
  cachedTrie ??= buildTrie(getDictionaryWords());
  return cachedTrie;
}
