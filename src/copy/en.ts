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

  nav: {
    /** Names the curriculum navigation landmark. */
    label: 'Curriculum',
    /** The collapsed label on small screens, where the rail does not fit. */
    contents: 'All topics',
    /** Marks the unit currently being read, for screen readers. */
    current: 'Current topic',
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
    LabelPicker: {
      title: 'Nominate the answer column',
      lead: 'Change which column counts as the answer, and watch which of the others turn out to matter.',
    },
    TrainingLoopRunner: {
      title: 'Run the loop yourself',
      lead: 'Nobody touches the dials this time. Press once and watch almost nothing happen — then press in larger jumps.',
    },
    ScoringRulePicker: {
      title: 'Pick what to score',
      lead: 'Four ways to score the same five answers. Watch a different one win each time — and see what it cost.',
    },
    FoggyDescentWalk: {
      title: 'Walk downhill in the fog',
      lead: 'Step one at a time and watch it come to rest. Then lift the fog and see where it stopped.',
    },
    StepSizeRace: {
      title: 'Race three strides',
      lead: 'Three walkers, one hill, one difference: how far each moves. Find the stride that arrives — then the one that never does.',
    },
    ClusterFinder: {
      title: 'Ask it for a number of groups',
      lead: 'Start at three, then ask for four: the score improves while nothing is learned. Then change only where the search began.',
    },
    ExploreExploitBandit: {
      title: 'Try, score, adjust',
      lead: 'Nobody ever tells it the right move. Watch it settle — and notice what it settled for.',
    },
    FreeLabelMaker: {
      title: 'Cover a word and guess it back',
      lead: 'Move the blank along and see which gaps you can fill from grammar alone — and which ones you cannot.',
    },
    FlexibilityDial: {
      title: 'Add one dial at a time',
      lead: 'Push right until it stops making mistakes on the sales it studied. Then reveal the eight it has never seen.',
    },
    LeakageSplitter: {
      title: 'Score it on what it never saw',
      lead: 'Read the studied pile, then the held-back one. Then stop a round appearing on both sides, and watch the score get worse.',
    },
    ThresholdMatrix: {
      title: 'Turn the bar up and down',
      lead: 'Start at the far left, where it raises no alarms at all, and read the accuracy. Then drag right.',
    },
    TasteNeuron: {
      title: 'Set someone else’s taste in films',
      lead: 'Turn the three dials until it recommends what you would. Then take the bend out and find what it can no longer be taught.',
    },
    BlameFlow: {
      title: 'Hand out the blame',
      lead: 'One wrong answer, and every dial is told its share of it. Try to guess which dial is told to move most, then press and see.',
    },
    MeaningMap: {
      title: 'Move around a map of meaning',
      lead: 'Drop the marker somewhere new and read its neighbours. Then follow the same arrow from a different word and see where you land.',
    },
    PronounFlip: {
      title: 'Change one word, move the meaning',
      lead: 'Swap the last word and watch what “it” now points at. Nothing else in the sentence moved.',
    },
    TokenSplitter: {
      title: 'Cut a sentence into the pieces a model reads',
      lead: 'Type a rare name, a long number, and something that is not English — and watch the piece count rather than the letters.',
    },
    AttentionMap: {
      title: 'Watch one word ask the others',
      lead: 'Pick a word and read where its attention went. Try “she” first, then try “because”.',
    },
    MultiHeadLanes: {
      title: 'Four readings of one sentence',
      lead: 'Same words, four heads, four different answers. Find the word they disagree about most.',
    },
    OrderBlindness: {
      title: 'Shuffle the words and see what survives',
      lead: 'Scramble the sentence and compare the two readouts closely. Then stamp positions in and scramble it again.',
    },
    NextPieceLoop: {
      title: 'Write one piece at a time',
      lead: 'Press once and read the row it chose from. Then let it run, and find the moment it could not take something back.',
    },
    TemperatureDial: {
      title: 'Turn the wandering up and down',
      lead: 'Take it to the bottom and run it twice — the same sentence both times. Then push it up until something odd gets through.',
    },
    ContextBudget: {
      title: 'Fill a window that does not grow',
      lead: 'Keep adding to the conversation until something has to go. Then choose what you would drop, and see what that costs you.',
    },
    FineTuneOrPromptSorter: {
      title: 'Sort the jobs into two piles',
      lead: 'Decide which of these belong in the dials and which belong in the prompt. Three of them are not what they look like.',
    },
    PreferenceRater: {
      title: 'Pick the better of two',
      lead: 'You never write an answer. Pick a winner ten times and watch a personality nobody described come out the other end.',
    },
    ThinkingBudget: {
      title: 'Give it room to think',
      lead: 'Same question, more room to write before answering. Then find the question where the extra room changes nothing at all.',
    },
    SpotTheFabrication: {
      title: 'Find the invented one',
      lead: 'Four confident answers, one of them made up. Pick it before you reveal — then see what gave it away, and what did not.',
    },
    PromptLeverBoard: {
      title: 'Pull the levers on one request',
      lead: 'The question never changes. Change what you tell it about who it is and what this is for, and watch the answers narrow.',
    },
    ExampleSetBuilder: {
      title: 'Build the example set',
      lead: 'Add examples one at a time and watch the format lock. Then add the awkward one, and see what it rescues.',
    },
    ChunkCutter: {
      title: 'Cut the document up',
      lead: 'Cut it into big pieces and search. Then cut smaller. Then find the passage that cannot be found however you cut it.',
    },
    MeaningVsKeywordSearch: {
      title: 'Search the same shelf two ways',
      lead: 'Ask using none of the document’s own words. Then search for an exact product code, and watch the two methods swap places.',
    },
    AgentTraceExplorer: {
      title: 'Let it choose its own next step',
      lead: 'Step through once and find where the decision is actually made. Then change one result and watch the whole plan go elsewhere.',
    },
    EvalScoreboard: {
      title: 'Fix one case, then check the rest',
      lead: 'Change the instruction until the failing case passes. Then read the other nine before you decide it worked.',
    },
    PrecisionDial: {
      title: 'Spend fewer digits on each dial',
      lead: 'Drop the precision and watch the model shrink. Find where it is still the same model — and the step just after that.',
    },
    ConceptMap: {
      title: 'The whole site as one picture',
      lead: 'Find where you are, then follow the arrows backwards to see what a lesson is standing on.',
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
