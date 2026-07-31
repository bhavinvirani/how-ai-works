/**
 * UI microcopy — the small, structural strings that belong to controls rather
 * than to lessons.
 *
 * WHY THIS FILE EXISTS. CLAUDE.md hard rule 10 says no user-facing English
 * lives inside components, so that i18n stays cheap. Lesson prose obeys that by
 * living in MDX. Control chrome cannot: an interactive must work as a bare
 * `<TokenizerPlayground />` tag with zero required props (§3.3), so it cannot
 * demand that every MDX author supply a label for its reset button. And an
 * icon-only button still needs an accessible name, which is still English.
 *
 * The resolution is this module: one locale file, imported by components,
 * never inlined. That preserves what rule 10 is actually protecting — there is
 * still exactly one place to translate — while keeping the zero-required-props
 * contract intact. Swapping `en` for another locale stays a single-file change.
 *
 * Lesson prose must NEVER be added here. If a string teaches something, it
 * belongs in MDX.
 */

export const ui = {
  instrument: {
    /** Accessible name for the control that returns an instrument to its defaults. */
    reset: 'Reset',
    /** Announced when an instrument returns to its defaults. */
    resetAnnouncement: 'Reset to starting values',
    /** Labels the region containing an instrument's controls. */
    controls: 'Controls',
  },

  fallback: {
    /** Shown in place of an instrument that needs a pointer, on small screens. */
    needsLargerScreen:
      'This instrument needs a larger screen to use. Here is what it shows.',
  },

  reveal: {
    show: 'Show answer',
    hide: 'Hide answer',
  },

  stepper: {
    /**
     * Written as functions so the whole sentence lives in the locale file.
     * Concatenating a verb onto a label at the call site is the thing that
     * makes translation awkward later.
     */
    decrease: (label: string) => `Decrease ${label}`,
    increase: (label: string) => `Increase ${label}`,
  },

  devAside: {
    /** The collapsed label on a developer aside. */
    summary: 'For developers',
    /** Labels the language tab list inside a developer aside. */
    languages: 'Language',
  },

  progress: {
    markComplete: 'Mark as complete',
    markIncomplete: 'Mark as not complete',
    complete: 'Complete',
  },
} as const;

export type UiCopy = typeof ui;
