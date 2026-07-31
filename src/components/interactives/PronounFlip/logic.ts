/**
 * Pure logic for PronounFlip (§3.3).
 *
 * The instrument teaches one thing: a sentence can be rewritten by a word that
 * has not been read yet. Two sentences share every word up to and including a
 * pronoun, differ by exactly one word after it, and that pronoun ends up
 * meaning two different things.
 *
 * WHAT THIS IS NOT. Nothing here runs a model, and nothing here is a model's
 * output. Each pair's two readings are hand-written facts about what the
 * sentence means to a person, sitting beside the sentence in `data.en.ts`. The
 * unit this instrument belongs to is about the *problem*; the machinery that
 * eventually copes with it arrives several units later. Presenting a lookup
 * table as a prediction would be the exact dishonesty the quality bar exists to
 * prevent, so the panel says so on its face.
 *
 * WHY THE SENTENCES LIVE IN `data.en.ts` AND NOT HERE. Everything about a pair
 * is language-bound — not just the words, but which word is the pronoun, how
 * far after it the deciding word falls, and which of the two candidates each
 * reading picks. Translating this instrument means writing three new pairs,
 * not re-labelling these. So the pairs are data and this file is the arithmetic
 * over them: positions are *derived* from the sentences rather than written
 * down beside them, which is what stops a hand-maintained index from drifting
 * away from the text it points at.
 *
 * Nothing is random and nothing reads a clock. The same pair and the same slot
 * produce the same markup and the same reading on every visit.
 */

/** The three pairs, in the order the reader meets them. */
export type PairId = 'soup' | 'tow' | 'chess';

export const PAIR_IDS: readonly PairId[] = ['soup', 'tow', 'chess'];

/**
 * Which of a pair's two readings is on show.
 *
 * Deliberately a slot rather than the ending word itself: the reader can change
 * pair and ending independently, and a slot survives a change of pair while a
 * word ("empty") does not. That removes a whole class of state-coordination
 * bug from the view.
 */
export type Slot = 'a' | 'b';

export const SLOTS: readonly Slot[] = ['a', 'b'];

/** One of the two things a pronoun could be pointing at. */
export interface Candidate {
  /** The word exactly as it appears in the sentence, used to locate it. */
  readonly word: string;
  /** How the readout names it in a sentence. */
  readonly name: string;
}

/** One way the sentence can end, and what it then means. */
export interface Reading {
  /** The whole sentence, ending included. */
  readonly sentence: string;
  /** Which candidate the pronoun means. Hand-authored; see the file header. */
  readonly refersTo: 0 | 1;
  /** What a person knows about the world that settles it. */
  readonly because: string;
}

export interface SentencePair {
  /** Short handle for the control that chooses between pairs. */
  readonly label: string;
  /** The pronoun in question, exactly as it appears in the sentence. */
  readonly pronoun: string;
  readonly candidates: readonly [Candidate, Candidate];
  readonly readings: Readonly<Record<Slot, Reading>>;
}

/** A sentence, cut at the spaces. Punctuation stays attached to its word. */
export function wordsOf(sentence: string): readonly string[] {
  return sentence.trim().split(/\s+/);
}

/**
 * A word with its leading and trailing punctuation removed, lower-cased.
 *
 * Only the ends are stripped, so "I'm" and "don't" survive intact while
 * "empty." and "out," reduce to the word underneath.
 */
export function bare(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '').toLowerCase();
}

/** Where a word first appears in a sentence, or -1. */
export function indexOfWord(words: readonly string[], word: string): number {
  const target = bare(word);
  return words.findIndex((candidate) => bare(candidate) === target);
}

export function pronounIndex(pair: SentencePair, slot: Slot): number {
  return indexOfWord(wordsOf(pair.readings[slot].sentence), pair.pronoun);
}

/**
 * Every position at which the pair's two sentences disagree.
 *
 * Returned as a list rather than a single index so that a pair which has
 * quietly grown a second difference fails a test instead of silently losing
 * the point of the instrument.
 */
export function differingPositions(pair: SentencePair): readonly number[] {
  const first = wordsOf(pair.readings.a.sentence);
  const second = wordsOf(pair.readings.b.sentence);
  const longest = Math.max(first.length, second.length);
  const positions: number[] = [];

  for (let index = 0; index < longest; index += 1) {
    if (first[index] !== second[index]) positions.push(index);
  }

  return positions;
}

/** The one position the pair differs at, or -1 if it differs at none or many. */
export function swapPosition(pair: SentencePair): number {
  const positions = differingPositions(pair);
  return positions.length === 1 ? (positions[0] ?? -1) : -1;
}

/** The deciding word, as a bare word, for one of the two readings. */
export function swappedWord(pair: SentencePair, slot: Slot): string {
  const at = swapPosition(pair);
  if (at < 0) return '';

  return bare(wordsOf(pair.readings[slot].sentence)[at] ?? '');
}

/** How many words after the pronoun the deciding word falls. */
export function swapDistance(pair: SentencePair, slot: Slot): number {
  const at = swapPosition(pair);
  const pronounAt = pronounIndex(pair, slot);
  if (at < 0 || pronounAt < 0) return 0;

  return at - pronounAt;
}

/** What the pronoun means once this ending has been read. */
export function referent(pair: SentencePair, slot: Slot): Candidate {
  return pair.candidates[pair.readings[slot].refersTo];
}

/**
 * Everything up to and including the pronoun — what a machine reading left to
 * right has in front of it at the moment the question is asked.
 */
export function readSoFar(pair: SentencePair, slot: Slot): readonly string[] {
  const words = wordsOf(pair.readings[slot].sentence);
  const stop = pronounIndex(pair, slot);

  return stop < 0 ? words : words.slice(0, stop + 1);
}

/**
 * True when the words read so far are identical in both readings AND the two
 * readings disagree about the answer.
 *
 * This is the instrument's whole claim in one predicate: identical evidence,
 * different answer. It is not "the machine is not clever enough" — there is
 * nothing in the evidence to be clever about.
 */
export function undecidedAtPronoun(pair: SentencePair): boolean {
  return (
    readSoFar(pair, 'a').join(' ') === readSoFar(pair, 'b').join(' ') &&
    pair.readings.a.refersTo !== pair.readings.b.refersTo
  );
}

export type Role = 'plain' | 'pronoun' | 'candidate' | 'swapped';

export interface MarkedWord {
  readonly text: string;
  readonly role: Role;
  /** A candidate the pronoun turns out to mean. Never true while stopped. */
  readonly chosen: boolean;
  /** Past the pronoun, with the reader stopped there. */
  readonly unread: boolean;
}

/**
 * The sentence, one word at a time, with the job each word is doing.
 *
 * The view holds no arithmetic (§3.3), so every position question — which word
 * is the pronoun, which one changed, which candidate won — is answered here.
 */
export function markUp(
  pair: SentencePair,
  slot: Slot,
  stopAtPronoun: boolean,
): readonly MarkedWord[] {
  const words = wordsOf(pair.readings[slot].sentence);
  const pronounAt = pronounIndex(pair, slot);
  const swapAt = swapPosition(pair);
  const chosenAt = indexOfWord(words, referent(pair, slot).word);
  const candidatesAt = pair.candidates.map((candidate) =>
    indexOfWord(words, candidate.word),
  );

  return words.map((text, index) => {
    let role: Role = 'plain';
    if (index === pronounAt) role = 'pronoun';
    else if (index === swapAt) role = 'swapped';
    else if (candidatesAt.includes(index)) role = 'candidate';

    return {
      text,
      role,
      chosen: !stopAtPronoun && index === chosenAt && index !== pronounAt,
      unread: stopAtPronoun && pronounAt >= 0 && index > pronounAt,
    };
  });
}
