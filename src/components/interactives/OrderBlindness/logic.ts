/**
 * OrderBlindness — the same nine words in two arrangements, and what each word
 * works out in both.
 *
 * The arithmetic all lives in `../shared/attention/logic`, which `AttentionMap`
 * and `MultiHeadLanes` also read. Nothing here recomputes attention; this file
 * only arranges the words two ways, decides which slot the watched word landed
 * in, and puts the two results side by side. That is deliberate — the claim
 * this instrument makes is about *the same machine* run twice, and it would be
 * worth nothing if the second run went through a second implementation.
 *
 * WHY THE COMPARISON IS ON THE BLEND AND NOT ON THE WEIGHTS. Comparing the rows
 * of weights would settle nothing: they are indexed by slot, so shuffling the
 * words shuffles the row along with them and the two rows look different for a
 * reason that has nothing to do with meaning. What has to match is what each
 * word ends up *meaning* after the mixing — and that does match, exactly, which
 * is the whole unit.
 *
 * Both facts are worth showing at once, so `compare` returns the weights as
 * well: the reader watches 43% travel from one chip to another while the four
 * numbers underneath refuse to move.
 */
import {
  asPercent,
  attentionRow,
  blend,
  FEATURES,
  HEAD_IDS,
  HEADS,
  sameBlend,
  strongestSource,
} from '../shared/attention/logic';
import type { Feature, Head, Token } from '../shared/attention/logic';
import {
  SENTENCE,
  SHUFFLED_ORDER,
  WORD,
} from '../shared/attention/sentences.en';

export { asPercent, FEATURES, HEAD_IDS, SENTENCE };
export type { Feature, Token };

/** Reading order: the word written `index`th sits in slot `index`. */
export const AS_WRITTEN: readonly number[] = SENTENCE.map((_, index) => index);

/** What every word would get if a row had nothing to prefer. */
export const EVEN_SHARE = 1 / SENTENCE.length;

/**
 * The reader arrives from `attention` having just watched "she" find
 * "student", so that is where this opens — the surprise is cheaper when the
 * starting position is already familiar.
 */
export const DEFAULT_HEAD_ID = 'reference';

/**
 * Annotated `number` rather than left to inference: `WORD` is `as const`, so
 * `WORD.she` has the literal type `6`, and a `useState` seeded with it would
 * refuse every other word in the sentence.
 */
export const DEFAULT_FOCUS: number = WORD.she;

/** Fails loudly rather than quietly comparing a word against nothing. */
function tokenAt(sentence: readonly Token[], index: number): Token {
  const token = sentence[index];
  if (!token) throw new Error(`no word in slot ${String(index)}`);
  return token;
}

export function headById(id: string): Head {
  const head = HEADS.find((candidate) => candidate.id === id);
  if (!head) throw new Error(`no head named ${id}`);
  return head;
}

/** Slot → the word that sits there, written as an index into the sentence. */
export function arrangementOrder(shuffled: boolean): readonly number[] {
  return shuffled ? SHUFFLED_ORDER : AS_WRITTEN;
}

export function arrange(shuffled: boolean): readonly Token[] {
  return arrangementOrder(shuffled).map((from) => tokenAt(SENTENCE, from));
}

/**
 * Where the word written `index`th has ended up in this arrangement.
 *
 * The inverse of `arrangementOrder`, and the only piece of bookkeeping the
 * instrument needs: the reader picks a word in the sentence, and the lower row
 * has to highlight the same word wherever the shuffle threw it.
 */
export function slotOf(shuffled: boolean, index: number): number {
  const slot = arrangementOrder(shuffled).indexOf(index);
  if (slot < 0) throw new Error(`word ${String(index)} is not in this order`);
  return slot;
}

export function wordAt(index: number): string {
  return tokenAt(SENTENCE, index).text;
}

/**
 * True when a row hands every word the same share.
 *
 * Worth naming, because a flat row has no strongest word and calling the first
 * one a winner would be a lie about a nine-way tie. The view says "spreads it
 * evenly" instead, which is also the honest reading of a head that cannot see
 * anything to prefer.
 */
export function spreadEvenly(
  weights: readonly number[],
  tolerance = 1e-9,
): boolean {
  if (weights.length === 0) return false;
  const even = 1 / weights.length;
  return weights.every((weight) => Math.abs(weight - even) < tolerance);
}

export interface Settings {
  readonly headId: string;
  /** The word being watched, numbered as it is written in the sentence. */
  readonly focusIndex: number;
  readonly shuffled: boolean;
  readonly positional: boolean;
}

export interface Comparison {
  /** The words of the lower row, in the order they now sit. */
  readonly arranged: readonly Token[];
  /** Which slot of that row the watched word landed in. */
  readonly arrangedFocus: number;
  readonly writtenWeights: readonly number[];
  readonly arrangedWeights: readonly number[];
  readonly writtenBlend: Readonly<Record<Feature, number>>;
  readonly arrangedBlend: Readonly<Record<Feature, number>>;
  /** Whether the watched word means the same thing in both arrangements. */
  readonly identical: boolean;
  readonly writtenSpread: boolean;
  readonly arrangedSpread: boolean;
  /** The word each row leans on hardest, by name. Meaningless when spread. */
  readonly writtenLeansOn: string;
  readonly arrangedLeansOn: string;
}

/**
 * One word, run through one head, in both arrangements at once.
 *
 * Everything the view draws comes out of this call, so the two rows on screen
 * cannot drift out of step with the two rows in the readout.
 */
export function compare(settings: Settings): Comparison {
  const head = headById(settings.headId);
  const options = { positional: settings.positional };

  const arranged = arrange(settings.shuffled);
  const arrangedFocus = slotOf(settings.shuffled, settings.focusIndex);

  const writtenWeights = attentionRow(
    SENTENCE,
    settings.focusIndex,
    head,
    options,
  );
  const arrangedWeights = attentionRow(arranged, arrangedFocus, head, options);

  const writtenBlend = blend(SENTENCE, settings.focusIndex, head, options);
  const arrangedBlend = blend(arranged, arrangedFocus, head, options);

  return {
    arranged,
    arrangedFocus,
    writtenWeights,
    arrangedWeights,
    writtenBlend,
    arrangedBlend,
    identical: sameBlend(writtenBlend, arrangedBlend),
    writtenSpread: spreadEvenly(writtenWeights),
    arrangedSpread: spreadEvenly(arrangedWeights),
    writtenLeansOn: tokenAt(
      SENTENCE,
      strongestSource(SENTENCE, settings.focusIndex, head, options),
    ).text,
    arrangedLeansOn: tokenAt(
      arranged,
      strongestSource(arranged, arrangedFocus, head, options),
    ).text,
  };
}
