import { describe, expect, it } from 'vitest';
import { getDictionaryTrie, getDictionaryWords, parseWords } from '../game/dictionary';
import { hasWord } from '../game/trie';

describe('parseWords', () => {
  it('trims, uppercases and filters short/garbage lines', () => {
    const words = parseWords('  cat \nDOG\n\nab\nC4T\nbird\nCAT');
    expect(words).toEqual(['BIRD', 'CAT', 'DOG']);
  });
});

describe('bundled dictionary', () => {
  it('contains common words and no sub-3-letter entries', () => {
    const words = getDictionaryWords();
    expect(words.length).toBeGreaterThan(10_000);
    const trie = getDictionaryTrie();
    for (const w of ['CAT', 'DOG', 'QUIZ', 'WORD']) {
      expect(hasWord(trie, w)).toBe(true);
    }
    for (const w of words) {
      expect(w).toMatch(/^[A-Z]{3,}$/);
    }
  });
});
