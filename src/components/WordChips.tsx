export interface WordChipsProps {
  words: readonly string[];
  label?: string;
}

/** Sorted chips of words; used for the found list and result dialogs. */
export function WordChips({ words, label }: WordChipsProps) {
  const sorted = words.slice().sort((a, b) => a.localeCompare(b));
  return (
    <ul class="chips" aria-label={label}>
      {sorted.map((word) => (
        <li key={word} class="chips__chip">
          {word}
        </li>
      ))}
    </ul>
  );
}
