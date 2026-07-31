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

  unit: {
    /** Heading above the generated connections footer (§2.2 step 5). */
    whereItFits: 'Where it fits',
    /** Heading above the prerequisite list. */
    readFirst: 'Read this first',
    /** Heading above a checkpoint question. */
    checkpoint: 'Checkpoint',
  },

  figure: {
    /** Prefix announced before a figure's plain-English description. */
    describes: 'What this shows',
  },

  /**
   * Per-interactive chrome: the title and the one-line "what to try".
   *
   * It lives here rather than inside each instrument because an interactive has
   * to work as a bare tag with zero required props (§3.3) — so it needs a
   * default title, and a default title inlined in a component is exactly what
   * hard rule 10 forbids.
   *
   * `pnpm new:interactive` appends entries immediately above the marker below.
   */
  interactives: {
    SpamRuleWriter: {
      title: 'Write the rules yourself',
      lead: 'Find a set that keeps every real message and blocks every junk one. Then switch to next week.',
    },
    DialTuner: {
      title: 'Turn the dials by hand',
      lead: 'Two numbers control the whole line. Get the wrongness as low as you can, and notice how you did it.',
    },
    // new:interactive inserts above this line — do not remove.
  } as Record<string, { title: string; lead: string }>,

  progress: {
    markComplete: 'Mark as complete',
    markIncomplete: 'Mark as not complete',
    complete: 'Complete',

    /** The /progress page. Utility chrome, not lesson prose. */
    page: {
      title: 'Your progress',
      lead: 'What you have finished so far, and how to carry it to another device.',

      privacyHeading: 'This stays on your device',
      privacyBody:
        'Your progress is stored in this browser and never sent anywhere. There is no account and no server holding it — which also means clearing your browser data clears this, and another device will not know about it unless you move the file yourself.',

      empty:
        'Nothing recorded yet. Progress appears here once there are units to finish.',

      exportHeading: 'Move it to another device',
      exportBody:
        'Download a file here, then load it on the other device. It merges with whatever is already there rather than replacing it, so neither side loses work.',
      exportAction: 'Download my progress',
      importAction: 'Load a progress file',

      clearHeading: 'Start over',
      clearBody:
        'Erases everything recorded in this browser. It cannot be undone.',
      clearAction: 'Erase my progress',
      clearConfirm:
        'Erase all progress in this browser? This cannot be undone.',

      importedOne: (count: number) =>
        `Loaded progress for ${String(count)} unit${count === 1 ? '' : 's'}.`,
      cleared: 'Progress erased.',
      unitsComplete: (done: number, total: number) =>
        `${String(done)} of ${String(total)} finished`,
    },
  },
} as const;

export type UiCopy = typeof ui;
