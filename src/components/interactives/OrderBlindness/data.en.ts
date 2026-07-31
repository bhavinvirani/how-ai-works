/**
 * Words for OrderBlindness. English, and kept out of both the logic and the
 * view — the same split every other instrument here uses.
 *
 * WHY NOT `src/copy/en.ts`: that file is control chrome. The heads, the
 * features and the readout are this unit's teaching material, and an
 * instrument with zero required props cannot ask an MDX author to hand it
 * four head descriptions.
 *
 * The readout is written as whole sentences rather than as adjectives the view
 * glues onto a number. It is also the only version of this instrument a screen
 * reader gets: two rows of tinted chips and a table of decimals say nothing
 * out loud, so whatever the eye is supposed to notice has to be stated here in
 * words (hard rule 9).
 */
import type { Feature } from './logic';

/**
 * What each head is watching for, in the learner's words rather than in the
 * module's ids.
 *
 * Short on purpose: four of these sit side by side in one segmented control,
 * and a label that wraps to three lines is a label nobody reads.
 */
export const HEAD_LABELS: Record<string, string> = {
  reference: 'what it stands for',
  doer: 'who did it',
  'subject-matter': 'what happened to it',
  'previous-word': 'the word just before',
};

/** The four meaning dimensions a word can carry, named for a reader. */
export const FEATURE_LABELS: Record<Feature, string> = {
  pronoun: 'stands in for something',
  animate: 'a person or an animal',
  thing: 'a thing',
  action: 'an action',
};

export const TEXT = {
  headLabel: 'Which reading you are watching',

  shuffleLabel: 'Shuffle the words',
  shuffleDescription:
    'Puts the same nine words in a different order in the lower row. Nothing is added or taken away.',

  positionLabel: 'Stamp each word with the slot it sits in',
  positionDescription:
    'Adds where a word sits to what it means, before any comparing happens.',

  /** Headings above the two rows, so the eye can tell them apart at a glance. */
  writtenHeading: 'the sentence',
  arrangedHeading: (shuffled: boolean) =>
    shuffled ? 'the same nine words, shuffled' : 'the same nine words, unmoved',

  writtenLabel: (word: string) =>
    `The sentence as written, showing where “${word}” spent its attention. Choose any word to watch it instead.`,
  arrangedLabel: (word: string) =>
    `The lower arrangement, showing where “${word}” spent its attention there.`,

  describeChoice: (word: string, percent: number) =>
    `${word}, ${String(percent)} per cent. Watch this word instead.`,
  describeChip: (word: string, percent: number) =>
    `${word}, ${String(percent)} per cent.`,

  /**
   * Four decimal places, because the claim being made is that the two columns
   * agree exactly and two places would let a reader suspect rounding did it.
   */
  amount: (value: number) => value.toFixed(4),

  tableCaption: (word: string) =>
    `What “${word}” comes out meaning, in each arrangement`,
  columnFeature: 'it comes out carrying',
  columnWritten: 'in the sentence',
  columnArranged: (shuffled: boolean) =>
    shuffled ? 'in the shuffle' : 'in the lower row',

  verdictSameOrder: (word: string) =>
    `Both rows hold the same words in the same order, so of course they agree. Shuffle them and watch what “${word}” comes out meaning.`,

  verdictIdentical: (word: string) =>
    `The words moved and “${word}” came out meaning exactly the same thing — the same four numbers, digit for digit. Nothing in this machinery ever asked which word came first, so there was nothing for the shuffle to disturb.`,

  verdictDiffers: (word: string) =>
    `Now “${word}” comes out meaning something different in the two rows. Each word arrived carrying the slot it sits in, so moving it changed every comparison it took part in.`,

  leaning: (word: string, written: string, arranged: string) =>
    `In the sentence, “${word}” leans hardest on “${written}”. In the lower row, on “${arranged}”.`,

  leaningSpread: (word: string) =>
    `Under this reading “${word}” finds nothing to prefer, so it spreads its attention evenly over all nine words — the same flat row in both arrangements. This head has nothing to work with until the slots are stamped in.`,

  honesty:
    'The arithmetic here is the real thing. What is staged is where the scores come from: a real model learns them, and most of its heads track something nobody can name. These four are written by hand so that a nine-word sentence is enough to see the pattern.',
} as const;
