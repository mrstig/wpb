export interface StatusBarProps {
  foundCount: number;
  totalCount: number;
  score: number;
  onFinish: () => void;
  onRotate: () => void;
}

export function StatusBar({
  foundCount,
  totalCount,
  score,
  onFinish,
  onRotate,
}: StatusBarProps) {
  return (
    <header class="status-bar">
      <p class="status-bar__stats">
        Found {foundCount} of {totalCount} · Score {score}
      </p>
      <div class="status-bar__actions">
        <button type="button" class="btn" onClick={onFinish}>
          Finish
        </button>
        <button
          type="button"
          class="btn"
          onClick={onRotate}
          aria-label="Rotate board"
        >
          Rotate
        </button>
      </div>
    </header>
  );
}
