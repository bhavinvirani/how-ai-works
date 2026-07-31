/**
 * Shared class strings for controls.
 *
 * These exist so the focus ring, control border, and readout treatment cannot
 * drift between primitives — the thing that makes fifty interactives from
 * thirty contributors still look like one product.
 *
 * Written as complete literal strings on purpose. Tailwind reads source files
 * as plain text and never evaluates them, so a computed class name
 * (`border-${tone}`) produces no CSS at all.
 */

/**
 * Interactive control outline. Uses --color-rule-strong rather than
 * --color-rule: anything outlining a control has to clear WCAG 1.4.11's 3:1
 * non-text contrast, and the decorative hairline does not.
 */
export const CONTROL_BORDER = 'border border-rule-strong';

/** Surface a control sits on. */
export const CONTROL_SURFACE = 'bg-paper-raised';

/** Recessed surface: slider tracks, segmented-control wells, readouts. */
export const CONTROL_WELL = 'bg-paper-sunken';

/**
 * Focus treatment. Relies on the global :focus-visible rule in global.css for
 * the ring itself; this only guarantees the ring is never clipped by an
 * ancestor's overflow.
 */
export const FOCUS_RING = 'focus-visible:outline-offset-2';

/** Token-driven transition. Collapses to instant under prefers-reduced-motion. */
export const CONTROL_TRANSITION =
  'transition-colors duration-[var(--duration-fast)] ease-out-soft';

/** The label above or beside a control. */
export const CONTROL_LABEL = 'text-sm font-medium text-ink';

/**
 * The value readout.
 *
 * Every control shows its current value in the mono face. On a teaching site
 * this is not decoration: the learner's whole job is to watch a number change
 * and understand what it did, so a control that hides its value teaches
 * nothing.
 */
export const CONTROL_READOUT =
  'bg-paper-sunken rounded-sm px-1.5 py-0.5 font-mono text-xs text-ink tabular-nums';

/** Disabled treatment, applied alongside the native disabled attribute. */
export const CONTROL_DISABLED =
  'disabled:opacity-50 disabled:cursor-not-allowed';

/** A pressable square button, used by Stepper and instrument chrome. */
export const BUTTON_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-rule-strong bg-paper-raised text-ink hover:bg-paper-sunken active:bg-paper-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[var(--duration-fast)] ease-out-soft';
