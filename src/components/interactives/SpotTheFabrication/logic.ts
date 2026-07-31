/**
 * Pure logic for SpotTheFabrication (§3.3).
 *
 * The instrument teaches one thing: what separates a fabricated answer from a
 * true one is never a property of the writing. It is whether the source says
 * it — and finding that out costs a line-by-line comparison, which is exactly
 * the work readers skip.
 *
 * WHY A GUESSING GAME RATHER THAN A DEMONSTRATION. "You cannot tell by reading"
 * is a sentence every reader agrees with and no reader believes about
 * themselves. So the reader commits to an accusation before anything is
 * revealed, and then the panel measures the four answers on the three surfaces
 * people actually judge by — hedging, figures and length — and shows that all
 * six readings of those surfaces accuse an answer that is true. That is not an
 * opinion about the writing. It is arithmetic over the writing, and
 * `logic.test.ts` pins it.
 *
 * THE FABRICATION IS PARTLY SUPPORTED, ON PURPOSE. The invented answer cites a
 * real line of the passage and then adds one clause with nothing behind it,
 * because that is what fabrication actually looks like: true-shaped parts
 * assembled into an object that was never there. An answer that contradicted
 * the passage outright would be findable by skimming, and would teach the wrong
 * lesson.
 *
 * EVERYTHING IS FICTIONAL. The workshop, the street and the award do not exist,
 * so no line here is a false claim about a real person or organisation. That is
 * a hard constraint on this instrument, not a stylistic choice.
 *
 * Nothing here is random and nothing reads a clock. Same passage, same four
 * answers, same measurements, on every visit.
 */

/** The five lines of the passage the machine was given, in order. */
export type SourceLineId = 'origin' | 'woods' | 'days' | 'closures' | 'prize';

export const SOURCE_LINE_IDS: readonly SourceLineId[] = [
  'origin',
  'woods',
  'days',
  'closures',
  'prize',
];

export type AnswerId = 'timbers' | 'building' | 'award' | 'summer';

export interface Answer {
  readonly id: AnswerId;
  /**
   * Lines of the passage this answer is built out of. Never empty — the
   * invented one cites the passage too, which is the whole difficulty.
   */
  readonly supports: readonly SourceLineId[];
  /** True when some clause of the answer traces to nothing in the passage. */
  readonly invented: boolean;
}

/**
 * Declaration order is panel order, and it is also the tie-break order for
 * `accusedBy`, so it is written down once here and never re-sorted.
 *
 * The invented answer sits third of four: first would be met before the reader
 * has calibrated, last would be met after they had already decided.
 */
export const ANSWERS: readonly Answer[] = [
  { id: 'timbers', supports: ['woods'], invented: false },
  { id: 'building', supports: ['origin'], invented: false },
  { id: 'award', supports: ['prize'], invented: true },
  { id: 'summer', supports: ['closures', 'days'], invented: false },
];

export function answerById(id: AnswerId): Answer {
  const found = ANSWERS.find((answer) => answer.id === id);
  if (found === undefined) throw new Error(`no answer called ${id}`);
  return found;
}

/**
 * The one answer with something in it that the passage does not support.
 *
 * Computed, with a guard, rather than written down a second time: a data edit
 * that marks two answers invented — or none — should fail loudly at import
 * rather than quietly make the panel unanswerable.
 */
export const INVENTED: Answer = (() => {
  const found = ANSWERS.filter((answer) => answer.invented);
  if (found.length !== 1) {
    throw new Error('exactly one answer must be the invented one');
  }
  return found[0];
})();

/** Right means having accused the answer that has something invented in it. */
export const isRight = (picked: AnswerId): boolean =>
  answerById(picked).invented;

/**
 * The words readers read as uncertainty.
 *
 * Deliberately a short, plain list rather than anything clever. It is not
 * trying to be a linguistics result — it is trying to stand in for the thing a
 * person does when they scan four answers for the one that sounds least sure of
 * itself.
 */
const HEDGE_WORDS: readonly string[] = [
  'about',
  'apparently',
  'around',
  'generally',
  'likely',
  'may',
  'might',
  'perhaps',
  'possibly',
  'probably',
  'roughly',
  'seems',
  'appears',
  'typically',
  'usually',
];

/** How many hedging words are in a piece of writing. */
export function countHedges(text: string): number {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.filter((word) => HEDGE_WORDS.includes(word)).length;
}

/** How many runs of digits — years, counts, page numbers — are in it. */
export function countFigures(text: string): number {
  return (text.match(/\d+/g) ?? []).length;
}

/** How long it is, counted the way a reader eyeballs it. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/** Everything about an answer that can be read off its surface. */
export interface Profile {
  readonly hedges: number;
  readonly figures: number;
  readonly words: number;
}

export type Measure = keyof Profile;

export const MEASURES: readonly Measure[] = ['hedges', 'figures', 'words'];

export function profile(text: string): Profile {
  return {
    hedges: countHedges(text),
    figures: countFigures(text),
    words: countWords(text),
  };
}

/**
 * The six ways a reader tries to pick the odd one out by looking at the writing.
 *
 * Both ends of each measure, because both are used and they contradict each
 * other: some readers accuse the answer that sounds most certain, others accuse
 * the one that hedges. Listing only the flattering half would be rigging the
 * result.
 */
export type Tell =
  | 'fewest-hedges'
  | 'most-hedges'
  | 'most-figures'
  | 'fewest-figures'
  | 'longest'
  | 'shortest';

export const TELLS: readonly Tell[] = [
  'fewest-hedges',
  'most-hedges',
  'most-figures',
  'fewest-figures',
  'longest',
  'shortest',
];

interface Reading {
  readonly of: Measure;
  readonly want: 'max' | 'min';
}

const READINGS: Record<Tell, Reading> = {
  'fewest-hedges': { of: 'hedges', want: 'min' },
  'most-hedges': { of: 'hedges', want: 'max' },
  'most-figures': { of: 'figures', want: 'max' },
  'fewest-figures': { of: 'figures', want: 'min' },
  longest: { of: 'words', want: 'max' },
  shortest: { of: 'words', want: 'min' },
};

/** The four answers, as written. Supplied by the caller so logic never holds prose. */
export type AnswerTexts = Readonly<Record<AnswerId, string>>;

/**
 * Which answer a reader going purely by this surface would accuse.
 *
 * Ties go to the first answer declared, which is the only tie-break that stays
 * the same between two runs and between two people. It matters here: two of the
 * four answers hedge not at all, so "the one that sounds most certain" is a tie,
 * and a reader picking either of them is picking a true answer regardless.
 */
export function accusedBy(tell: Tell, texts: AnswerTexts): AnswerId {
  const { of, want } = READINGS[tell];

  return ANSWERS.reduce((best, answer) => {
    const here = profile(texts[answer.id])[of];
    const there = profile(texts[best.id])[of];
    const beats = want === 'max' ? here > there : here < there;
    return beats ? answer : best;
  }, ANSWERS[0]).id;
}

/**
 * True when this answer is neither the highest nor the lowest of the four on a
 * given measure — that is, when nothing about that measure singles it out.
 *
 * Exported because it is the instrument's actual claim, and a claim the prose
 * makes should be something the build can check rather than something somebody
 * eyeballed once.
 */
export function sitsInTheMiddle(
  id: AnswerId,
  measure: Measure,
  texts: AnswerTexts,
): boolean {
  const values = ANSWERS.map((answer) => profile(texts[answer.id])[measure]);
  const mine = profile(texts[id])[measure];

  return Math.min(...values) < mine && mine < Math.max(...values);
}
