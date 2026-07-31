/**
 * Words for PromptLeverBoard. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 *
 * One request, chosen because the machine genuinely knows the answer. If the
 * reader could suspect that a lever was supplying a fact rather than shaping a
 * document, the whole instrument would teach the wrong thing — and the unit
 * spends a section insisting that no opening can supply a fact.
 */
import type { LeverId, Levers, OutcomeKey } from './logic';
import { pulledInOrder } from './logic';

/** The line at the top of the document. It never changes. That is the point. */
export const REQUEST = 'Explain how a fridge makes things cold.';

/**
 * What each lever writes underneath the request.
 *
 * Every clause names one setting on one dimension and says nothing about the
 * other two, which is what makes the levers independent — and what makes the
 * count fall by exactly a third each time.
 */
export const CLAUSES: Record<LeverId, string> = {
  who: 'You are explaining it to a nine-year-old.',
  shape: 'Write it as three numbered steps, one line each.',
  purpose: 'They have to explain it to their class tomorrow.',
};

/** The switch chrome. What pulling it does, in the reader's words. */
export const LEVERS: Record<LeverId, { label: string; description: string }> = {
  who: {
    label: 'Say who is speaking, and to whom',
    description:
      'A page for a nine-year-old and a page for a trainee engineer are two different documents, and only one of them can follow this line.',
  },
  shape: {
    label: 'Say what shape the answer should take',
    description:
      'A document that promises three numbered steps has almost no plausible continuation that is not three numbered steps.',
  },
  purpose: {
    label: 'Say what it is for',
    description:
      'What an explanation is needed for decides what goes in it and what gets left out.',
  },
};

/**
 * The twenty-seven endings, laid out as the three dimensions they are made of.
 *
 * The first setting on each row is the commonest one in the pile — the setting
 * that gets written whenever nothing in the opening has said otherwise. The
 * second is the one that dimension's lever names. The third is never named by
 * any lever, and it is here on purpose: it is the visible evidence that saying
 * one thing rules out more than one alternative.
 */
export const DIMENSIONS: Record<
  LeverId,
  { caption: string; options: readonly string[] }
> = {
  who: {
    caption: 'who it is written for',
    options: ['nobody in particular', 'a nine-year-old', 'a trainee engineer'],
  },
  shape: {
    caption: 'what shape it comes in',
    options: [
      'one flowing paragraph',
      'three numbered steps',
      'a question and answer',
    ],
  },
  purpose: {
    caption: 'what it is for',
    options: [
      'knowing roughly what it is',
      'passing it on to somebody else',
      'working out why yours has stopped',
    ],
  },
};

/**
 * What the machine writes in each of the eight states of the board.
 *
 * Not eight arbitrary samples: each one is the ending made of whatever settings
 * survived — the ones the opening named, and the commonest on every dimension
 * it left alone. Which is why the first of them is competent, correct and of no
 * use to anybody, and the last is the one you wanted.
 *
 * Held as lines rather than as a blob so that the shape of the document is a
 * property the tests can check: one line where the opening asked for a
 * paragraph, three where it asked for three steps.
 */
export const CONTINUATIONS: Record<OutcomeKey, readonly string[]> = {
  none: [
    'A refrigerator does not generate cold; it transfers heat from its interior to the surrounding air. A refrigerant circulates through a sealed loop, absorbing heat inside the cabinet and releasing it through the condenser coils at the rear, driven by a compressor. The cycle continues until the internal temperature reaches the set point.',
  ],

  who: [
    'Inside a fridge there is a loop of pipes with a special liquid running round it, and a little pump pushing the liquid along. Where the pipes run through the cold part, the liquid soaks up heat from your food. Where they come out at the back, it lets that heat go into the kitchen. That is why the back of a fridge is warm.',
  ],

  shape: [
    '1. A compressor squeezes the refrigerant, raising its pressure and its temperature.',
    '2. The condenser coils at the rear release that heat into the surrounding air.',
    '3. The refrigerant expands inside the cabinet, absorbing heat and lowering the temperature.',
  ],

  purpose: [
    'The sentence to hold on to is that a refrigerator moves heat rather than making cold. Everything else hangs off it: the sealed loop is how the heat travels, the compressor is what keeps it travelling, and the warm coils at the back are where it is let go. Anyone who can say that first sentence can answer most of what gets asked after it.',
  ],

  'who+shape': [
    '1. A little pump squeezes a special liquid until the liquid goes hot.',
    '2. Round the back of the fridge, that hot liquid lets its heat out into the kitchen.',
    '3. Back inside, the liquid spreads out again and drinks up the heat from your food.',
  ],

  'who+purpose': [
    'Here is the one thing to remember, and everything else follows from it: a fridge does not make cold, it steals heat. A special liquid goes round a loop, picking heat up from your food and dropping it off behind the fridge. Go and put your hand near the back of yours — it is warm, and that warmth used to be in the milk. Say that, and you have explained a fridge.',
  ],

  'shape+purpose': [
    '1. Start here: a refrigerator moves heat rather than making cold.',
    '2. A refrigerant does the carrying — it absorbs heat in the cabinet and releases it at the coils behind.',
    '3. Finish with the proof: the coils at the back are warm, and that warmth came out of the food.',
  ],

  'who+shape+purpose': [
    "1. A fridge doesn't make cold. It steals the heat out of your food and carries it away.",
    '2. A special liquid goes round a loop, picking the heat up inside and dropping it off round the back.',
    '3. Tell them to feel the back of a fridge. It is warm — and that warmth used to be in the milk.',
  ],
};

/**
 * The document as it now stands: the request, then one line per lever pulled,
 * always in the same order however the reader got there.
 */
export function openingLines(levers: Levers): readonly string[] {
  return [REQUEST, ...pulledInOrder(levers).map((id) => CLAUSES[id])];
}

/** Marks the setting that actually gets written, in a face that is not colour. */
export const WRITTEN_MARK = '▸';

export const TEXT = {
  openingLabel: 'The opening you hand it',
  openingNote:
    'The first line is the request and it never changes. Every lever writes one more line underneath it.',

  boardLabel: 'What could plausibly come next',
  boardNote: `${WRITTEN_MARK} is the ending it writes. A setting struck through is one this opening has stopped being able to lead to.`,

  writesLabel: 'So it writes',

  /**
   * The count, said three ways, because the interesting sentence is different
   * at each end. Wide is not variety, one is not a rule, and the middle is
   * just arithmetic.
   */
  count: (fits: number, total: number, gone: number) => {
    if (fits === total) {
      return `Nothing has been narrowed yet: all ${String(total)} endings still fit this opening. So it writes the middle of them — the shape that turns up most often in the pile it learned from.`;
    }

    if (fits === 1) {
      return `One ending fits. The other ${String(gone)} were not forbidden; they simply stopped being plausible continuations of the lines above.`;
    }

    return `${String(fits)} of the ${String(total)} endings still fit. ${String(gone)} have stopped being plausible continuations of the lines above.`;
  },

  chosen: (who: string, shape: string, purpose: string) =>
    `It comes out as ${shape}, written for ${who}, aimed at ${purpose}.`,
} as const;
