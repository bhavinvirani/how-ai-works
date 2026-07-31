/**
 * The sentences for PronounFlip, and the words around them. English, and kept
 * out of both the logic and the view.
 *
 * WHY THIS FILE AND NOT `src/copy/en.ts` — the same reason as every other
 * instrument that carries its own teaching material: `src/copy/en.ts` holds
 * control chrome, and an instrument with zero required props cannot demand
 * that each MDX author hand it three sentence pairs.
 *
 * WHY THE PAIRS ARE HERE AND NOT IN `logic.ts` — see that file's header. Every
 * fact about a pair is language-bound, including which word is the pronoun and
 * how far after it the deciding word falls, so the whole pair is data and the
 * positions are derived from it.
 *
 * HONESTY. `refersTo` is a hand-written fact about what the sentence means to a
 * person, not a model's output, and `TEXT.honesty` says so inside the panel.
 * The pairs are chosen so that a reader will agree with every one of them
 * instantly — that agreement is the demonstration, and it only works if nobody
 * is being asked to trust a black box.
 */
import type { PairId, SentencePair } from './logic';

/**
 * Three pairs. Each is one word away from its partner, that word is the last
 * word of the sentence, and it falls after the pronoun it rewrites — which is
 * what `logic.test.ts` pins.
 *
 * The three are deliberately unalike underneath. Settling the first needs to
 * know what pouring does to two containers; the second, that weight is a
 * complaint about a load and size a complaint about a vehicle; the third, why
 * people win and lose games. No rule about grammar reaches any of them, and no
 * single kind of world knowledge covers all three.
 */
export const PAIRS: Readonly<Record<PairId, SentencePair>> = {
  soup: {
    label: 'pan and bowl',
    pronoun: 'it',
    candidates: [
      { word: 'pan', name: 'the pan' },
      { word: 'bowl', name: 'the bowl' },
    ],
    readings: {
      a: {
        sentence: 'She tipped the pan into the bowl until it was empty.',
        refersTo: 0,
        because:
          'Tipping empties whatever you tip out of, and that is the pan.',
      },
      b: {
        sentence: 'She tipped the pan into the bowl until it was full.',
        refersTo: 1,
        because: 'Tipping fills whatever you tip into, and that is the bowl.',
      },
    },
  },

  tow: {
    label: 'van and caravan',
    pronoun: 'it',
    candidates: [
      { word: 'van', name: 'the van' },
      { word: 'caravan', name: 'the caravan' },
    ],
    readings: {
      a: {
        sentence:
          'The van could not tow the caravan up the hill because it was too heavy.',
        refersTo: 1,
        because:
          'Being too heavy is a complaint about the thing being pulled, so it is the caravan.',
      },
      b: {
        sentence:
          'The van could not tow the caravan up the hill because it was too small.',
        refersTo: 0,
        because:
          'Being too small is a complaint about the thing doing the pulling, so it is the van.',
      },
    },
  },

  chess: {
    label: 'Rosa and Nadia',
    pronoun: 'she',
    candidates: [
      { word: 'Rosa', name: 'Rosa' },
      { word: 'Nadia', name: 'Nadia' },
    ],
    readings: {
      a: {
        sentence: 'Rosa beat Nadia at chess because she had been practising.',
        refersTo: 0,
        because: 'Practice is a reason to win, and the winner is Rosa.',
      },
      b: {
        sentence: 'Rosa beat Nadia at chess because she had been distracted.',
        refersTo: 1,
        because:
          'Being distracted is a reason to lose, and the loser is Nadia.',
      },
    },
  },
};

/**
 * Whole sentences rather than fragments the view glues together, so that the
 * claim lives here and translating it means rewriting a sentence.
 *
 * The readout is also the only thing a screen reader gets: the boxes and
 * underlines drawn around the words carry nothing that is not said again in
 * words here (hard rule 9).
 */
export const TEXT = {
  pairLabel: 'Which pair of sentences',
  endingLabel: 'How it ends',

  stopLabel: 'Stop reading at the pronoun',
  stopDescription:
    'Show only the words a machine reading left to right has in front of it at the moment the pronoun turns up.',

  /** Stands in for the words the reader has not reached yet. */
  rest: '…',

  resolved: (pronoun: string, name: string, because: string) =>
    `“${pronoun}” means ${name}. ${because}`,

  swapNote: (word: string, distance: number) =>
    `One word is different between these two sentences: ${word}. It is the last word in the sentence, and it lands ${String(distance)} words after the pronoun it rewrites.`,

  undecided: (pronoun: string, first: string, second: string) =>
    `“${pronoun}” could be ${first} and it could be ${second}. Both endings read exactly like this up to here, so there is nothing on this line to decide it with — switch the ending back and forth and not one word above changes.`,

  honesty:
    'Nothing in this panel is a model’s answer. Each reading is written down by hand — what the sentence means to a person who reads it. This unit is about the problem, and nothing here solves it.',
} as const;
