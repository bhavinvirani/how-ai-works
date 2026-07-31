/**
 * Pure logic for PrecisionDial (§3.3).
 *
 * The instrument teaches one thing: spending fewer binary digits on each dial
 * shrinks a model a great deal for almost nothing, right up until it does not
 * — and the collapse, when it comes, lands on some abilities long before it
 * shows up in the ones a reader would casually check.
 *
 * WHY A MODEL AND NOT A TABLE. Seventy hand-typed scores would be seventy
 * assertions. Everything here falls out of two facts per ability instead, and
 * both of them are things a reader has already met:
 *
 *   MARGIN — at every decision the model makes, the answer it picks is some
 *   distance ahead of the runner-up. On something it has seen a million times
 *   that lead is enormous. On something rare it is a hair.
 *
 *   STEPS  — how many of those decisions have to go the right way for the
 *   whole task to come out right. A one-line reply needs one. A page of
 *   arithmetic needs all of them.
 *
 * Rounding the dials adds noise to every decision. A decision survives while
 * the noise stays under the margin, and a task survives while all of its
 * decisions do. That is the entire model, and it produces the shape the unit
 * is about without anybody drawing it: a long flat top, because the noise is
 * far under every margin, and then a cliff, because the noise crosses several
 * margins within a digit or two of each other — the narrow ones first.
 *
 * WHAT IS REAL AND WHAT IS SHAPED. Real: the sizes, the number of rungs at a
 * given width, how much less there is to carry, that rounding error grows by
 * doubling for every digit removed, and the ORDER in which abilities fail.
 * Shaped: the five abilities and their two numbers each, chosen so the whole
 * story fits on one screen. Nothing here is a measurement of any real model,
 * and the unit says so in as many words.
 *
 * DETERMINISTIC (§3.3). No randomness, no clock. Every score below is the same
 * arithmetic on the same constants today and in two years, which is what lets
 * the prose, the tests and the panel all quote the same figures.
 */

/** The five things the reader can watch fail in different orders. */
export type AbilityId = 'chat' | 'summary' | 'rare' | 'code' | 'chain';

export interface Ability {
  readonly id: AbilityId;
  /**
   * How far ahead the right answer sits at each decision, before any rounding.
   * Small means the runner-up was already close behind.
   */
  readonly margin: number;
  /** How many decisions have to survive for the whole task to come out right. */
  readonly steps: number;
}

/**
 * Five abilities, chosen so that no two of them fail for the same reason.
 *
 * `chat` and `rare` differ only in margin: one decision each, and the second
 * one has almost no room. `code` and `chain` have comfortable margins and lose
 * anyway, because they need six and twelve decisions to all land. Between them
 * they are the argument — "how much did quantizing cost?" has no single answer.
 */
export const ABILITIES: readonly Ability[] = [
  /** A short reply, a rewrite, a bit of chat. Common ground, one decision. */
  { id: 'chat', margin: 0.2, steps: 1 },
  /** Summarising a page you pasted in. Common, but it has to hold together. */
  { id: 'summary', margin: 0.185, steps: 3 },
  /** Something it barely knows. One decision, and almost no room in it. */
  { id: 'rare', margin: 0.115, steps: 1 },
  /** Code that has to actually run. Six decisions, every one load-bearing. */
  { id: 'code', margin: 0.135, steps: 6 },
  /** Twelve steps of arithmetic. The longest chain here, and the first to go. */
  { id: 'chain', margin: 0.15, steps: 12 },
];

export const ABILITY_IDS: readonly AbilityId[] = ABILITIES.map(
  (ability) => ability.id,
);

/** The ability a reader would check first, and the one that lies to them. */
export const EVERYDAY: AbilityId = 'chat';

/**
 * Sixteen binary digits per dial is the yardstick, not the ceiling.
 *
 * Training mostly happens at thirty-two, and dropping to sixteen for serving
 * is so routine that nobody counts it as compression at all. Sixteen is where
 * the comparisons in this panel start from, so by definition it scores 100 on
 * everything and has nothing rounded away.
 */
export const REFERENCE_BITS = 16;

/** Two digits is four rungs, which is as far down as anyone seriously goes. */
export const MIN_BITS = 2;
export const MAX_BITS = REFERENCE_BITS;

export const BIT_WIDTHS: readonly number[] = Array.from(
  { length: MAX_BITS - MIN_BITS + 1 },
  (_, index) => MIN_BITS + index,
);

/** A seven-billion-dial model: the smallest size anyone runs at home. */
export const DIALS = 7_000_000_000;

/**
 * Keeping the sensitive dials at a higher width costs bookkeeping — a scale
 * for every small group, and a list of which dials were spared. Half a digit
 * per dial, averaged over the model, is about what real methods pay.
 */
export const BOOKKEEPING_BITS = 0.5;

/**
 * How much of the rounding noise still reaches a decision once the dials that
 * matter most have been left at a higher width.
 *
 * Under a half, which is the useful way to read it: spending more digits where
 * they matter is worth roughly one whole binary digit everywhere else.
 */
export const SPARED = 0.45;

/**
 * How abruptly a decision fails once the noise reaches its margin.
 *
 * Not a cliff edge, because it is not one: margins vary from case to case
 * within the same kind of task, so an ability frays before it snaps. Small
 * enough that the fraying takes about one digit rather than five.
 */
const SOFTNESS = 0.02;

export function clampBits(bits: number): number {
  return Math.min(MAX_BITS, Math.max(MIN_BITS, Math.round(bits)));
}

/** How many distinct values a dial may take at this width. */
export function levelsAt(bits: number): number {
  return 2 ** clampBits(bits);
}

/**
 * The gap between neighbouring rungs, as a share of the spread of the group of
 * dials being stored — and therefore the furthest any dial has to move to land
 * on one.
 *
 * Doubles for every digit removed. That doubling is the whole reason the
 * bottom of the slider behaves nothing like the top.
 */
export function roundingStepAt(bits: number): number {
  const width = clampBits(bits);

  return width >= REFERENCE_BITS ? 0 : 1 / (2 ** width - 1);
}

/** What a dial costs to store, bookkeeping included. */
export function effectiveBits(bits: number, careful: boolean): number {
  const width = clampBits(bits);

  return width >= REFERENCE_BITS
    ? width
    : width + (careful ? BOOKKEEPING_BITS : 0);
}

/** The whole model on disk, in gigabytes of a thousand million bytes. */
export function gigabytesAt(bits: number, careful: boolean): number {
  return (DIALS * effectiveBits(bits, careful)) / 8 / 1e9;
}

/**
 * How many times less there is to carry from memory to the processor for every
 * answer, against the sixteen-digit model.
 *
 * Deliberately not called a speed-up. It is the traffic, and traffic is what
 * generation spends most of its time waiting on — but the arithmetic does not
 * shrink with it, so the real speed-up is smaller than this and tapers off.
 */
export function trafficMultipleAt(bits: number, careful: boolean): number {
  return REFERENCE_BITS / effectiveBits(bits, careful);
}

/** How much noise rounding adds to each decision at this setting. */
export function noiseAt(bits: number, careful: boolean): number {
  return roundingStepAt(bits) * (careful ? SPARED : 1);
}

const decisionSurvives = (noise: number, ability: Ability): number =>
  1 / (1 + Math.exp((noise - ability.margin) / SOFTNESS));

const abilityFor = (id: AbilityId): Ability =>
  ABILITIES.find((ability) => ability.id === id) ?? ABILITIES[0];

/**
 * How much of this ability survives at this setting, as a percentage of what
 * the sixteen-digit model managed.
 *
 * One decision has to clear the margin; the whole task needs every one of its
 * decisions to. Which is why an ability with twelve decisions falls while an
 * ability with one is still reporting itself untouched.
 */
export function scoreAt(id: AbilityId, bits: number, careful: boolean): number {
  const ability = abilityFor(id);
  const survives = decisionSurvives(noiseAt(bits, careful), ability);
  const reference = decisionSurvives(0, ability);

  return 100 * (survives / reference) ** ability.steps;
}

export interface Reading {
  readonly id: AbilityId;
  readonly score: number;
}

export function readingsAt(bits: number, careful: boolean): readonly Reading[] {
  return ABILITIES.map((ability) => ({
    id: ability.id,
    score: scoreAt(ability.id, bits, careful),
  }));
}

/** The ability in the worst shape here. Ties go to the one listed first. */
export function worstAt(bits: number, careful: boolean): Reading {
  return readingsAt(bits, careful).reduce((worst, reading) =>
    reading.score < worst.score ? reading : worst,
  );
}

export type Verdict =
  /** Nothing has been rounded. This is what everything else is measured against. */
  | 'reference'
  /** Smaller, and nothing has measurably gone. */
  | 'intact'
  /** Everyday use is untouched and something else is not. The dangerous one. */
  | 'looks-fine'
  /** Still talks. Cannot do anything that needs more than a sentence. */
  | 'hollowed'
  /** Gone, including the part that was hiding the damage. */
  | 'broken';

/** Nothing this good is worth calling a loss. */
const INTACT = 95;

/** Below this, an ability is not degraded — it has stopped working. */
const GONE = 40;

/** Above this, casual use still reads like the model you started with. */
const STILL_TALKS = 60;

export function verdictFor(bits: number, careful: boolean): Verdict {
  if (clampBits(bits) >= REFERENCE_BITS) return 'reference';

  const worst = worstAt(bits, careful).score;

  if (worst >= INTACT) return 'intact';
  if (worst >= GONE) return 'looks-fine';
  if (scoreAt(EVERYDAY, bits, careful) >= STILL_TALKS) return 'hollowed';

  return 'broken';
}

/**
 * The widest setting at which something has already stopped working.
 *
 * Found by walking down from the reference rather than written in, so that a
 * later edit to any margin moves the cliff in the panel and in the tests
 * together instead of leaving one of them stale.
 */
export function cliffAt(careful: boolean): number {
  const found = [...BIT_WIDTHS]
    .reverse()
    .find((bits) => worstAt(bits, careful).score < GONE);

  return found ?? MIN_BITS;
}

export interface Panel {
  readonly bits: number;
  readonly careful: boolean;
  readonly levels: number;
  readonly referenceLevels: number;
  /** The furthest a dial has to move to land on a rung, as a percentage. */
  readonly driftPercent: number;
  readonly gigabytes: number;
  readonly referenceGigabytes: number;
  /** How much of the sixteen-digit model's size is left, as a percentage. */
  readonly sizeShare: number;
  readonly traffic: number;
  readonly readings: readonly Reading[];
  readonly everyday: Reading;
  readonly worst: Reading;
  readonly verdict: Verdict;
}

/**
 * Everything the panel shows at one setting, worked out in one place so the
 * view holds no arithmetic at all.
 */
export function panelAt(bits: number, careful: boolean): Panel {
  const width = clampBits(bits);
  const readings = readingsAt(width, careful);
  const gigabytes = gigabytesAt(width, careful);
  const referenceGigabytes = gigabytesAt(REFERENCE_BITS, careful);

  return {
    bits: width,
    careful,
    levels: levelsAt(width),
    referenceLevels: levelsAt(REFERENCE_BITS),
    driftPercent: roundingStepAt(width) * 100,
    gigabytes,
    referenceGigabytes,
    sizeShare: (gigabytes / referenceGigabytes) * 100,
    traffic: trafficMultipleAt(width, careful),
    readings,
    everyday:
      readings.find((reading) => reading.id === EVERYDAY) ?? readings[0],
    worst: worstAt(width, careful),
    verdict: verdictFor(width, careful),
  };
}

/** Full precision, nothing spared, nothing lost — and nothing saved either. */
export const DEFAULT_BITS = REFERENCE_BITS;
export const DEFAULT_CAREFUL = false;
