import { useEffect, useMemo, useReducer, useRef } from 'preact/hooks';
import { Board } from './components/Board';
import { CurrentWord } from './components/CurrentWord';
import { Dialog } from './components/Dialog';
import { ResultDialog } from './components/ResultDialog';
import { StatusBar } from './components/StatusBar';
import { WordChips } from './components/WordChips';
import { getDictionaryWords } from './game/dictionary';
import {
  gameReducer,
  missedWords,
  newGameState,
  restoredGameState,
} from './game/reducer';
import { classifyWord } from './game/selection';
import { clearGame, loadGame, saveGame } from './game/storage';
import type { Rng, WordStatus } from './game/types';

export interface AppProps {
  /** Dictionary override (tests); defaults to the bundled word list. */
  words?: readonly string[];
  /** Random source override (tests). */
  rng?: Rng;
  /** Pre-built starting state (tests); skips storage and generation. */
  initialState?: ReturnType<typeof newGameState>;
}

export function App({ words, rng = Math.random, initialState }: AppProps) {
  const dictionary = useMemo(() => words ?? getDictionaryWords(), [words]);

  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    if (initialState) return initialState;
    const saved = loadGame();
    return saved ? restoredGameState(saved, dictionary) : newGameState(dictionary, rng);
  });

  // Persist while playing or confirming; drop the save once a game ends.
  useEffect(() => {
    if (state.phase === 'missed-words' || state.phase === 'won') {
      clearGame();
    } else {
      saveGame({
        board: state.board.map(({ letter, x, y }) => ({ letter, x, y })),
        score: state.score,
        foundWords: [...state.foundWords],
      });
    }
  }, [state.phase, state.board, state.score, state.foundWords]);

  // Haptic feedback whenever a new word is accepted.
  const prevFoundCount = useRef(state.foundWords.length);
  useEffect(() => {
    const count = state.foundWords.length;
    if (count > prevFoundCount.current && typeof navigator.vibrate === 'function') {
      navigator.vibrate(30);
    }
    prevFoundCount.current = count;
  }, [state.foundWords.length]);

  // Word shown above the grid: live selection, else the last submission.
  // Animations only run for submission feedback, never mid-drag.
  const isDragging = state.selection.word.length > 0;
  let displayWord = state.selection.word;
  let displayStatus: WordStatus | null = isDragging
    ? classifyWord(displayWord, state.validWords, new Set(state.foundWords))
    : null;
  if (!displayWord && state.lastSubmit) {
    displayWord = state.lastSubmit.word;
    displayStatus = state.lastSubmit.accepted ? 'valid' : 'invalid';
  }

  return (
    <div class="app">
      <StatusBar
        foundCount={state.foundWords.length}
        totalCount={state.totalWords}
        score={state.score}
        onFinish={() => dispatch({ type: 'ask-finish' })}
        onRotate={() => dispatch({ type: 'rotate' })}
      />

      <section class="found-words" aria-label="Found words">
        <WordChips words={state.foundWords} label="Found words" />
      </section>

      <CurrentWord
        word={displayWord}
        status={displayStatus}
        seq={state.lastSubmit?.seq ?? 0}
        animated={!isDragging}
      />

      <Board
        board={state.board}
        selectedPath={state.selection.path}
        onSelectStart={(index) => dispatch({ type: 'select', index })}
        onTileEnter={(index) => dispatch({ type: 'select', index })}
        onRelease={() => dispatch({ type: 'release' })}
        onCancel={() => dispatch({ type: 'cancel-selection' })}
      />

      <Dialog
        open={state.phase === 'confirm-finish'}
        labelledBy="finish-title"
        onClose={() => dispatch({ type: 'cancel-finish' })}
      >
        <h2 id="finish-title" class="dialog__title">
          Finish game?
        </h2>
        <p>Are you sure you want to finish the game?</p>
        <div class="dialog__actions">
          <button
            type="button"
            class="btn btn--primary"
            onClick={() => dispatch({ type: 'finish' })}
          >
            Yes
          </button>
          <button
            type="button"
            class="btn"
            onClick={() => dispatch({ type: 'cancel-finish' })}
          >
            No
          </button>
        </div>
      </Dialog>

      <ResultDialog
        open={state.phase === 'missed-words'}
        title="Missed Words"
        intro={`You missed ${missedWords(state).length} ${
          missedWords(state).length === 1 ? 'word' : 'words'
        }:`}
        words={missedWords(state)}
        notice={state.notice}
        onPlayAgain={() =>
          dispatch({ type: 'restart', state: newGameState(dictionary, rng) })
        }
        onExit={() =>
          dispatch({ type: 'notice', message: 'Thanks for playing!' })
        }
      />

      <ResultDialog
        open={state.phase === 'won'}
        title="You won!"
        intro={`You found all ${state.foundWords.length} words:`}
        words={state.foundWords}
        notice={state.notice}
        onPlayAgain={() =>
          dispatch({ type: 'restart', state: newGameState(dictionary, rng) })
        }
        onExit={() =>
          dispatch({ type: 'notice', message: 'Thanks for playing!' })
        }
      />
    </div>
  );
}
