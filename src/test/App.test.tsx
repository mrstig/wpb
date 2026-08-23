import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { createGameState } from '../game/reducer';
import type { Board } from '../game/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

const DICT = ['CAT', 'CATS'];

/**
 * Row 0 spells C A T S; everything else is filler.
 * Cell (col,row) centre for a 400x400 board at 0,0 is
 * (col*100+50, row*100+50).
 */
function makeBoard(): Board {
  const letters =
    'C A T S Z Z Z Z Z Z Z Z Z Z Z Z'.split(' ').map((l) => (l === 'Z' ? 'X' : l));
  return letters.map((letter, index) => ({
    letter,
    x: index % 4,
    y: Math.floor(index / 4),
  }));
}

function cellPoint(index: number): { clientX: number; clientY: number } {
  return { clientX: (index % 4) * 100 + 50, clientY: Math.floor(index / 4) * 100 + 50 };
}

/** jsdom has no layout: pin the board's bounding box to 400x400 at 0,0. */
function mockBoardRect() {
  const rect = {
    left: 0,
    top: 0,
    width: 400,
    height: 400,
    right: 400,
    bottom: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    rect as DOMRect,
  );
}

async function mountApp() {
  mockBoardRect();
  const utils = render(
    <App initialState={createGameState(makeBoard(), DICT)} />,
  );
  await Promise.resolve();
  return utils;
}

function drag(grid: Element, indices: number[], pointerId = 1) {
  const [first, ...rest] = indices;
  fireEvent.pointerDown(grid, { pointerId, ...cellPoint(first) });
  for (const index of rest) {
    fireEvent.pointerMove(grid, { pointerId, ...cellPoint(index) });
  }
  fireEvent.pointerUp(grid, { pointerId, ...cellPoint(indices.at(-1)!) });
}

describe('App', () => {
  it('confirm dialog traps focus, focuses a button and closes on Escape', async () => {
    await mountApp();

    const finishBtn = screen.getByRole('button', { name: 'Finish' }) as HTMLElement;
    // A real click focuses the trigger; emulate that for jsdom.
    finishBtn.focus();
    fireEvent.click(finishBtn);

    const yes = screen.getByRole('button', { name: 'Yes' }) as HTMLElement;
    expect(document.activeElement).toBe(yes);

    // Escape dismisses the confirm dialog...
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Finish game?')).toBeNull();
    // ...and focus returns to the trigger.
    expect(document.activeElement).toBe(finishBtn);
  });


  it('renders stats and controls while playing', async () => {
    await mountApp();
    expect(screen.getByText(/Found 0 of \d+ · Score 0/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Rotate board' })).toBeDefined();
    expect(document.querySelectorAll('.tile')).toHaveLength(16);
  });

  it('accepts a dragged word: chip appears and score updates', async () => {
    const { container } = await mountApp();
    drag(container.querySelector('.board')!, [0, 1, 2]); // C A T

    expect(container.querySelector('.chips')?.textContent).toContain('CAT');
    expect(screen.getByText(/Score 1/)).toBeDefined();
  });

  it('shows the winning dialog when every word is found', async () => {
    const { container } = await mountApp();
    const grid = container.querySelector('.board')!;
    drag(grid, [0, 1, 2]); // CAT
    drag(grid, [0, 1, 2, 3]); // CATS

    expect(screen.getByText('You won!')).toBeDefined();
    expect(screen.getByText('You found all 2 words:')).toBeDefined();
  });

  it('finish flow: confirm shows missed words, play again resets', async () => {
    const { container } = await mountApp();

    // Find one word first so missed words are a strict subset.
    drag(container.querySelector('.board')!, [0, 1, 2]);

    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByText('Finish game?')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.queryByText('Finish game?')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(screen.getByText('Missed Words')).toBeDefined();
    expect(screen.getByText('You missed 1 word:')).toBeDefined();
    expect(container.textContent).toContain('CATS');

    // Exit shows an inline notice instead of an alert.
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(screen.getByText('Thanks for playing!')).toBeDefined();

    // Play again starts fresh.
    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    expect(screen.queryByText('Missed Words')).toBeNull();
    expect(screen.getByText(/Found 0 of \d+/)).toBeDefined();
  });

  it('rotating keeps the letters but clears any selection', async () => {
    const { container } = await mountApp();
    const grid = container.querySelector('.board')!;
    fireEvent.pointerDown(grid, { pointerId: 3, ...cellPoint(0) });
    fireEvent.pointerMove(grid, { pointerId: 3, ...cellPoint(1) });
    expect(grid.querySelectorAll('.tile--selected')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Rotate board' }));
    expect(grid.querySelectorAll('.tile--selected')).toHaveLength(0);

    // Letters preserved as a multiset.
    const letters = [...grid.querySelectorAll('.tile__letter')]
      .map((el) => el.textContent)
      .sort()
      .join(',');
    expect(letters).toEqual([...makeBoard().map((t) => t.letter)].sort().join(','));
  });

  it('persists progress to localStorage and restores it', async () => {
    const first = await mountApp();
    drag(first.container.querySelector('.board')!, [0, 1, 2]);
    const saved = JSON.parse(localStorage.getItem('wpb.gameState.v1')!);
    expect(saved.foundWords).toContain('CAT');
    expect(saved.score).toBe(1);
    cleanup();

    // Second mount with the same dictionary restores the save instead
    // of generating a random board. The saved board contains our C A T
    // row, so dragging the same cells must still work.
    mockBoardRect();
    const restored = render(<App words={DICT} />);
    await Promise.resolve();
    expect(restored.container.querySelector('.chips')?.textContent).toContain('CAT');
    expect(screen.getByText(/Score 1/)).toBeDefined();
  });

  it('ignores corrupt saves and starts a new game', async () => {
    localStorage.setItem('wpb.gameState.v1', '{oops');
    mockBoardRect();
    render(<App words={DICT} />);
    await Promise.resolve();
    expect(screen.getByText(/Found 0 of \d+ · Score 0/)).toBeDefined();
  });

  it('pointercancel discards the in-progress word', async () => {
    const { container } = await mountApp();
    const grid = container.querySelector('.board')!;
    fireEvent.pointerDown(grid, { pointerId: 9, ...cellPoint(0) });
    fireEvent.pointerMove(grid, { pointerId: 9, ...cellPoint(1) });
    fireEvent.pointerCancel(grid, { pointerId: 9 });
    expect(container.querySelector('.chips')?.textContent ?? '').not.toContain('CA');
    expect(screen.queryByText('You won!')).toBeNull();
  });
});
