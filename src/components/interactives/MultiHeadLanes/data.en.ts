/**
 * Words for MultiHeadLanes. English, and kept out of both the logic and the
 * view — same reason as every other instrument that carries its own teaching
 * text: `src/copy/en.ts` holds control chrome, and an instrument with zero
 * required props cannot demand that each MDX author hand it four head labels.
 *
 * WHY THE HEADS ARE NUMBERED. Calling them "the grammar head" and "the pronoun
 * head" would teach the exact misconception this unit exists to prevent. They
 * are numbered, and what each one asks is printed beneath as a question, which
 * is all a head ever is: one question, asked of every pair of words at once.
 * `TEXT.honesty` then says out loud that even these questions were written by
 * hand here and are not written by anyone in a real model.
 */
import type { LaneId } from './logic';

export interface HeadText {
  /** A number, deliberately. See the header. */
  readonly name: string;
  /** The one question this head asks of every pair of words. */
  readonly asks: string;
}

export const HEAD_TEXT: Record<LaneId, HeadText> = {
  reference: { name: 'Head 1', asks: 'what does this word stand for?' },
  doer: { name: 'Head 2', asks: 'who did this?' },
  'subject-matter': { name: 'Head 3', asks: 'what is this caught up in?' },
  'previous-word': { name: 'Head 4', asks: 'what came just before me?' },
};

/** Enough number words for four lanes; anything else falls back to the digit. */
const COUNT = ['none', 'one', 'two', 'three', 'four'] as const;

const count = (many: number): string => COUNT[many] ?? String(many);

export interface Opinion {
  readonly name: string;
  readonly asks: string;
  /** The word this head leans on hardest. */
  readonly on: string;
  readonly percent: number;
}

export interface ReadoutInput {
  /** The word currently doing the looking. */
  readonly word: string;
  readonly opinions: readonly Opinion[];
  /** How many heads had nothing to ask with. */
  readonly quiet: number;
  readonly evenPercent: number;
  readonly wordCount: number;
  /** How far apart the two furthest-apart readings are, as a percentage. */
  readonly spread: number;
  readonly widest: boolean;
}

/**
 * Whole sentences rather than fragments the view glues together, so that the
 * claim lives here and translating it means rewriting a sentence.
 *
 * The readout is also the only place the numbers are said in words. The chips
 * print their percentages, but a reader who is not looking at them gets this
 * paragraph and nothing else, so it has to carry the whole observation.
 */
export const TEXT = {
  pickLabel: 'Which word is doing the looking',
  pickRowLabel: 'The sentence — choose the word to read four ways',

  laneRowLabel: (name: string) =>
    `${name}, where it thinks the chosen word should look`,

  describeChip: (word: string, percent: number) =>
    `${word}, ${String(percent)}%`,

  readout: (input: ReadoutInput): string => {
    const spread = `Across the four readings, ${String(input.spread)}% of the attention sits somewhere different.`;

    const verdict = input.widest
      ? 'That is as far apart as these four heads ever get in this sentence.'
      : 'There is a word in this sentence they disagree about more than this one.';

    // No spread sentence here: with nothing to ask, all four rows are the same
    // row, so the number is 0 by construction and saying so adds nothing.
    if (input.opinions.length === 0) {
      return `Not one of the four heads has anything to ask about “${input.word}”, so all four spread ${String(input.evenPercent)}% over each of the ${String(input.wordCount)} words — four identical readings, worth exactly one reading. ${verdict}`;
    }

    const said = input.opinions
      .map(
        (opinion) =>
          `${opinion.name}, the one asking “${opinion.asks}”, puts ${String(opinion.percent)}% of its attention on “${opinion.on}”.`,
      )
      .join(' ');

    const rest =
      input.quiet === 0
        ? ''
        : ` The other ${count(input.quiet)} ${
            input.quiet === 1 ? 'has' : 'have'
          } nothing to ask about this word, so ${
            input.quiet === 1 ? 'it spreads' : 'each of them spreads'
          } ${String(input.evenPercent)}% over every word in the sentence.`;

    return `Of the four heads, ${count(input.opinions.length)} ${
      input.opinions.length === 1 ? 'has' : 'have'
    } an opinion about “${input.word}”. ${said}${rest} ${spread} ${verdict}`;
  },

  honesty:
    'These four heads were written by hand, and the questions under them are descriptions someone attached afterwards. A real model is given no questions at all — each head starts random and drifts into a job because being a copy of its neighbour makes the score no better.',

  fourthHead:
    'Head 4 never lights up, whichever word you pick. It is asking about position, and nothing in attention knows where a word sits. That is the next unit.',
} as const;
