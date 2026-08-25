import { Dialog } from './Dialog';
import { WordChips } from './WordChips';

export interface ResultDialogProps {
  open: boolean;
  title: string;
  intro: string;
  words: readonly string[];
  notice: string | null;
  onPlayAgain: () => void;
  onExit: () => void;
}

/**
 * End-of-game dialog, shared by the "missed words" and "you won" states.
 */
export function ResultDialog({
  open,
  title,
  intro,
  words,
  notice,
  onPlayAgain,
  onExit,
}: ResultDialogProps) {
  return (
    <Dialog open={open} labelledBy="result-title">
      <h2 id="result-title" class="dialog__title">
        {title}
      </h2>
      <p>{intro}</p>
      <WordChips words={words} label="Words" />
      {notice && (
        <p class="dialog__notice" role="status">
          {notice}
        </p>
      )}
      <div class="dialog__actions">
        <button type="button" class="btn btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button type="button" class="btn" onClick={onExit}>
          Exit
        </button>
      </div>
    </Dialog>
  );
}
