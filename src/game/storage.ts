import { GRID_SIZE, MIN_WORD_LENGTH, type StoredGame, type StoredTile } from './types';

const STORAGE_KEY = 'wpb.gameState.v1';
const LEGACY_KEY = 'gameState';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isStoredTile(value: unknown): value is StoredTile {
  if (typeof value !== 'object' || value === null) return false;
  const { letter, x, y } = value as Partial<StoredTile>;
  // The legacy format stored 'Qu' with mixed case; normalize before checking.
  const normalized = typeof letter === 'string' ? letter.toUpperCase() : '';
  const letterOk = normalized === 'QU' || /^[A-Z]$/.test(normalized);
  const xOk =
    typeof x === 'number' && Number.isInteger(x) && x >= 0 && x < GRID_SIZE;
  const yOk =
    typeof y === 'number' && Number.isInteger(y) && y >= 0 && y < GRID_SIZE;
  return letterOk === true && xOk && yOk;
}

function isStoredGame(value: unknown): value is StoredGame {
  if (typeof value !== 'object' || value === null) return false;
  const { board, score, foundWords } = value as Partial<StoredGame>;
  if (!Array.isArray(board) || board.length !== GRID_SIZE * GRID_SIZE) return false;
  if (!board.every(isStoredTile)) return false;

  // Tiles must cover every cell exactly once.
  const cells = new Set(board.map((t) => t.y * GRID_SIZE + t.x));
  if (cells.size !== GRID_SIZE * GRID_SIZE) return false;

  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
    return false;
  }
  if (
    !Array.isArray(foundWords) ||
    !foundWords.every(
      (w) => typeof w === 'string' && w.length >= MIN_WORD_LENGTH && /^[A-Z]+$/.test(w),
    )
  ) {
    return false;
  }
  return true;
}

/** Reads the saved game, tolerating corrupt or missing data. */
export function loadGame(store: StorageLike = localStorage): StoredGame | null {
  try {
    const raw = store.getItem(STORAGE_KEY) ?? store.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredGame(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persists the game and completes any legacy-key migration. */
export function saveGame(
  game: StoredGame,
  store: StorageLike = localStorage,
): void {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(game));
    store.removeItem(LEGACY_KEY);
  } catch {
    /* storage unavailable or full */
  }
}

/** Removes both the current and the legacy saved game. */
export function clearGame(store: StorageLike = localStorage): void {
  try {
    store.removeItem(STORAGE_KEY);
    store.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
