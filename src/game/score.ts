import { MIN_WORD_LENGTH } from './types';

/**
 * Classic Boggle scoring based on the written length of the word
 * ('QU' counts as two letters).
 */
export function wordScore(word: string): number {
  const length = word.length;
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  if (length === 7) return 5;
  return 11;
}

export function isLongEnough(word: string): boolean {
  return word.length >= MIN_WORD_LENGTH;
}
