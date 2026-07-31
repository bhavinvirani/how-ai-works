import { useId } from 'react';
import type { ReactNode } from 'react';

import { ui } from '../../copy/en';
import { BUTTON_BASE } from './styles';

export interface InstrumentPanelProps {
  /** What this instrument is. Shown as its heading. */
  title: string;
  /** One line telling the learner what to try. Optional but strongly encouraged. */
  lead?: string;
  /**
   * Returns the instrument to its starting values. When omitted, no reset
   * control is rendered — some instruments have nothing meaningful to reset.
   */
  onReset?: () => void;
  /**
   * Shown instead of the instrument below the `md` breakpoint. Required
   * whenever the interaction depends on hover or drag precision (§3.3) — pass
   * a `<StaticFallback>`.
   *
   * The breakpoint lives here rather than in each instrument so there is one
   * place to get it right, and it is a CSS swap rather than a matchMedia read:
   * a JS-driven choice would render the wrong branch during hydration.
   */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Standard chrome around every interactive (§3.3).
 *
 * Its job is to make an instrument recognisable as one: a titled surface, a
 * one-line invitation to fiddle, and a way back to the starting state. The
 * instrument itself supplies the controls.
 *
 * Rendered as a labelled `section` so screen reader users can navigate to it
 * as a region rather than meeting a bare pile of controls.
 */
export function InstrumentPanel({
  title,
  lead,
  onReset,
  fallback,
  children,
}: InstrumentPanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="not-content my-8 rounded-lg border border-rule bg-paper-raised shadow-sheet"
    >
      <header className="flex items-start justify-between gap-4 border-b border-rule px-4 py-3">
        <div className="flex flex-col gap-1">
          <h3
            id={headingId}
            className="font-display text-lg leading-tight font-semibold text-ink"
          >
            {title}
          </h3>
          {lead ? <p className="text-sm text-ink-muted">{lead}</p> : null}
        </div>

        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className={`${BUTTON_BASE} shrink-0 px-2.5 py-1 text-xs`}
          >
            {ui.instrument.reset}
          </button>
        ) : null}
      </header>

      {fallback ? (
        <>
          <div className="px-4 py-4 md:hidden">{fallback}</div>
          <div className="hidden px-4 py-4 md:block">{children}</div>
        </>
      ) : (
        <div className="px-4 py-4">{children}</div>
      )}
    </section>
  );
}
