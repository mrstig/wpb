import type { WordStatus } from '../game/types';
import { cx } from '../lib/cx';

export interface CurrentWordProps {
  /** The word to display; empty string shows a placeholder. */
  word: string;
  status: WordStatus | null;
  /** Changing this re-triggers the flash animation. */
  seq?: number;
  /** Animate only for submission feedback, never during an active drag. */
  animated?: boolean;
}

const STATUS_CLASS: Record<WordStatus, string> = {
  valid: 'current-word__text--valid',
  found: 'current-word__text--found',
  invalid: 'current-word__text--invalid',
};

export function CurrentWord({
  word,
  status,
  seq = 0,
  animated = false,
}: CurrentWordProps) {
  return (
    <div class="current-word" aria-live="polite">
      <span
        key={seq}
        class={cx('current-word__text', {
          ...(status ? { [STATUS_CLASS[status]]: true } : {}),
          'current-word__text--animated': animated,
        })}
      >
        {word || '\u00a0'}
      </span>
    </div>
  );
}
