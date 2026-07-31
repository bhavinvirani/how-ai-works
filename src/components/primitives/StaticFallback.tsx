import type { ReactNode } from 'react';

import { ui } from '../../copy/en';

export interface StaticFallbackProps {
  /**
   * What the instrument would have shown, in plain English. This is the whole
   * point of the fallback: a learner on a phone still has to get the idea, so
   * the caption has to teach, not apologise.
   */
  caption: string;
  /** The static visual — usually the same diagram the instrument animates. */
  children: ReactNode;
}

/**
 * Stands in for an instrument that genuinely cannot work without a pointer.
 *
 * Required whenever the interaction depends on hover or drag precision (§3.3).
 * Pass it to `InstrumentPanel`'s `fallback` prop rather than rendering it
 * directly — the panel owns the breakpoint so no instrument has to get the
 * media query right on its own.
 */
export function StaticFallback({ caption, children }: StaticFallbackProps) {
  return (
    <figure className="flex flex-col gap-2">
      {children}
      <figcaption className="text-sm text-ink-muted">
        <span className="block text-xs text-ink-faint">
          {ui.fallback.needsLargerScreen}
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}
