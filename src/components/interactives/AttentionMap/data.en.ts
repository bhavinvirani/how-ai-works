/**
 * Words for AttentionMap.
 *
 * Same split as every other instrument that carries its own teaching text: the
 * control chrome an instrument shares with all the others lives in
 * `src/copy/en.ts`, and the sentences that only make sense inside this panel
 * live here. An instrument with zero required props (§3.3) cannot ask the MDX
 * author to supply them, and hard rule 10 will not have them inlined in the
 * view.
 *
 * The sentence itself is not here — it is in
 * `../shared/attention/sentences.en`, because all three instruments in this
 * Part read the same nine words.
 */
import type { Feature } from '../shared/attention/logic';
import type { QuestionId } from './logic';

/**
 * The three questions, written as questions.
 *
 * Deliberately not "head one, head two, head three". A reader meeting this
 * instrument has just been told that every word puts a question to the
 * sentence; the control has to be that question, or the connection between the
 * paragraph and the panel has to be made twice.
 */
export const QUESTIONS: Readonly<Record<QuestionId, string>> = {
  reference: 'Who do I stand for?',
  doer: 'Who is doing this?',
  'subject-matter': 'What am I caught up in?',
};

/**
 * Plain names for the four meaning dimensions a word can carry.
 *
 * Written as things a word can be rather than as categories, so that a blended
 * row reads as a sentence about the word — "mostly a person now, partly a
 * thing" — rather than as a table of scores.
 */
export const MEANINGS: Readonly<Record<Feature, string>> = {
  pronoun: 'a pointing word',
  animate: 'a person',
  thing: 'a thing',
  action: 'an action',
};

/** Two decimal places: enough to see 0.43 beat 0.06, few enough to read. */
const decimal = (value: number): string => value.toFixed(2);

export const TEXT = {
  chipsLabel:
    'The nine words of the sentence. Choose any one to make it the word doing the asking; each word also shows the share of attention the chosen word gave it.',

  describeChip: (word: string, percent: number) =>
    `${word}, ${String(percent)} per cent`,

  questionLabel: 'What this round of attention is asking',

  /**
   * The rounding note, stated rather than hidden. Nine numbers that visibly add
   * to 101 look like a broken budget unless somebody says otherwise, and the
   * budget is the lesson.
   */
  rounding:
    'Shares are rounded to whole percentages, so the printed numbers can land a point either side of 100. The shares themselves always add to exactly 1.',

  meaningTitle: (word: string) =>
    `What “${word}” means, before and after this one round of attention`,
  before: 'Arrived carrying',
  after: 'Leaves carrying',

  /** The headline of the readout, for a word that had something to ask. */
  leaned: (word: string, onto: string, percent: number) =>
    `“${word}” leaned hardest on “${onto}”, spending ${String(percent)}% of everything it had there. Whatever is left over is all the rest of the sentence gets.`,

  /**
   * And for a word that did not — which covers both a word carrying no meaning
   * at all and a word whose meaning this particular question is not asking
   * about, so it must not claim the word is empty.
   */
  even: (word: string, percent: number, words: number) =>
    `“${word}” has nothing to ask with under this question, so no word answers it better than any other and its budget comes out flat — ${String(percent)}% to each of the ${String(words)} words, itself included. It ends up meaning the plain average of the sentence.`,

  became: (word: string, meaning: string, value: number) =>
    `“${word}” now carries ${meaning} more strongly than anything else it holds, at ${decimal(value)}.`,

  amount: (value: number) => decimal(value),
} as const;
