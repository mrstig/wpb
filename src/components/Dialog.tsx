import { useLayoutEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

export interface DialogProps {
  open: boolean;
  labelledBy: string;
  /** Called when the user presses Escape (omit for non-dismissable dialogs). */
  onClose?: () => void;
  children: ComponentChildren;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Minimal accessible dialog: moves focus in on open, traps Tab,
 * restores focus on close and optionally closes on Escape.
 */
export function Dialog({ open, labelledBy, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Layout effect so focus moves synchronously when the dialog opens.
  useLayoutEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Only restore focus if the previous target is still in the
      // document — restoring into a detached node would blur instead.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div class="dialog-overlay">
      <div
        ref={dialogRef}
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}
