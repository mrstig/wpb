import { useRef } from 'preact/hooks';
import { GRID_SIZE, type Board } from '../game/types';
import { tileIndexFromPoint } from '../game/board';
import { cx } from '../lib/cx';

export interface BoardProps {
  board: Board;
  selectedPath: readonly number[];
  onSelectStart: (index: number) => void;
  onTileEnter: (index: number) => void;
  onRelease: () => void;
  onCancel: () => void;
}

/**
 * The 4x4 grid. Selection is pointer-based (mouse, touch and pen via
 * Pointer Events); the pointer is captured so dragging off the grid or
 * out of the window still ends the gesture cleanly.
 */
export function Board({
  board,
  selectedPath,
  onSelectStart,
  onTileEnter,
  onRelease,
  onCancel,
}: BoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const indexAt = (clientX: number, clientY: number): number | null => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return tileIndexFromPoint(rect, clientX, clientY);
  };

  const handleDown = (event: PointerEvent) => {
    if (activePointer.current !== null) return;
    const index = indexAt(event.clientX, event.clientY);
    if (index === null) return;
    activePointer.current = event.pointerId;
    try {
      gridRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // Capture is best-effort; selection still works without it.
    }
    onSelectStart(index);
  };

  const handleMove = (event: PointerEvent) => {
    if (activePointer.current !== event.pointerId) return;
    const index = indexAt(event.clientX, event.clientY);
    if (index !== null) onTileEnter(index);
  };

  const handleUp = (event: PointerEvent) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    onRelease();
  };

  const handleCancel = (event: PointerEvent) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    onCancel();
  };

  // If the browser drops capture abnormally, make sure the next press
  // still works and the half-spelled word is discarded.
  const handleLostCapture = (event: PointerEvent) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    onCancel();
  };

  const selected = new Set(selectedPath);

  return (
    <div
      ref={gridRef}
      class="board"
      style={`--grid-size: ${GRID_SIZE}`}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
      onLostPointerCapture={handleLostCapture}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Game board. Drag across adjacent tiles to spell words."
    >
      {board.map((tile, index) => (
        <div
          key={index}
          class={cx('tile', {
            'tile--selected': selected.has(index),
            'tile--qu': tile.letter === 'QU',
          })}
        >
          <span class="tile__letter">
            {tile.letter === 'QU' ? (
              <>
                Q<span class="tile__u">u</span>
              </>
            ) : (
              tile.letter
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
