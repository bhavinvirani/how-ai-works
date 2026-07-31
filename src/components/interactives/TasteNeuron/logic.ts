/**
 * Pure logic for TasteNeuron (§3.3).
 *
 * The instrument teaches one thing: the small bend inside a neuron is the only
 * reason stacking neurons buys anything. Take it out and a whole stack collapses
 * into a single weighted sum — a machine that can only ever mean "more of this
 * is better", and can never mean "enough".
 *
 * THE MACHINE. Six films, three facts each. Three neurons are already tuned and
 * fixed; the reader's three dials sit on the neuron after them, saying how much
 * each of the three reports counts towards recommending a film. That split is
 * deliberate: it puts the reader on the *second* layer, which is the only place
 * from which the collapse is visible. Tuning the first layer would have taught
 * the multiply-and-add and hidden the point of the bend entirely.
 *
 * WHY IT CANNOT BE FAKED. Three of the six films share their word-of-mouth and
 * their running time exactly, and differ only in how much action they have: 2,
 * 5 and 9 out of 10. The reader wants the middle one and neither of the others.
 * Strip the bend and every route from the facts to the total is a weighted sum,
 * so the total is a straight line in the action fact — and a straight line
 * cannot be below a bar, above it, and below it again. That is not a fact about
 * these particular numbers; it is arithmetic, and it holds for every setting of
 * every dial. `bestAgreement(false)` proves it by exhaustion anyway.
 *
 * Nothing here is random. The films, the tuned neurons and the dial grid are
 * fixed, so `bestAgreement(false)` names the same number today and in two
 * years — which is what lets the prose and the tests quote the same figures.
 */

/** One of the six films the reader has already given a verdict on. */
export type FilmId =
  | 'late-harvest'
  | 'ninth-signal'
  | 'blast-radius'
  | 'crater-run'
  | 'long-winter'
  | 'paper-streets';

export interface Film {
  readonly id: FilmId;
  /** How much action, 0–10. */
  readonly action: number;
  /** How much the people you know have talked about it, 0–10. */
  readonly buzz: number;
  /** How long it is, 0–10, where 10 is very long indeed. */
  readonly length: number;
  /** What you said: would you watch it? */
  readonly watch: boolean;
}

/**
 * The six films, and your verdict on each.
 *
 * The first three are the trap. Same word of mouth, same running time, action
 * rising — and the verdicts go no, yes, no. That shape is the taste this whole
 * instrument is about: you want a film with something going on, and you do not
 * want to be shouted at for two hours.
 */
export const FILMS: readonly Film[] = [
  { id: 'late-harvest', action: 2, buzz: 7, length: 6, watch: false },
  { id: 'ninth-signal', action: 5, buzz: 7, length: 6, watch: true },
  { id: 'blast-radius', action: 9, buzz: 7, length: 6, watch: false },
  { id: 'crater-run', action: 5, buzz: 3, length: 6, watch: false },
  { id: 'long-winter', action: 5, buzz: 8, length: 10, watch: false },
  { id: 'paper-streets', action: 4, buzz: 8, length: 3, watch: true },
];

/** The three films that differ only in how much action they have. */
export const TRAP_FILM_IDS: readonly FilmId[] = [
  'late-harvest',
  'ninth-signal',
  'blast-radius',
];

export type DetectorId = 'enough-happening' | 'never-stops' | 'worth-the-time';

/** A neuron: one weight per fact, plus a bias, and then the bend. */
export interface Detector {
  readonly id: DetectorId;
  readonly onAction: number;
  readonly onBuzz: number;
  readonly onLength: number;
  /** Added on regardless of the film. How high this neuron's own bar sits. */
  readonly bias: number;
}

/**
 * The first layer: three neurons, already tuned, each looking at all three
 * facts. Their weights are not adjustable — this instrument is about what the
 * layer *after* them can and cannot do.
 *
 * The first two are the pair that matters. Both are dominated by the action
 * fact and differ mainly in where their bar sits: one starts reporting at about
 * 3 out of 10, the other not until about 7. With the bend in, that pair can be
 * added into a hump. With the bend out, they are two straight lines, and two
 * straight lines added together are a straight line.
 */
export const DETECTORS: readonly Detector[] = [
  {
    id: 'enough-happening',
    onAction: 0.5,
    onBuzz: 0.04,
    onLength: -0.04,
    bias: -1.6,
  },
  {
    id: 'never-stops',
    onAction: 1,
    onBuzz: -0.02,
    onLength: 0.04,
    bias: -7,
  },
  {
    id: 'worth-the-time',
    onAction: -0.02,
    onBuzz: 0.34,
    onLength: -0.3,
    bias: 0.3,
  },
];

/** The last neuron's own bias: the bar a film has to clear to be recommended. */
export const OUTPUT_BIAS = -1;

/** One setting per tuned neuron, in the order they appear in `DETECTORS`. */
export type Dials = readonly [number, number, number];

export const MIN_DIAL = -2;
export const MAX_DIAL = 2;
export const DIAL_STEP = 0.1;

/**
 * Every dial at zero would recommend nothing at all, which reads as a machine
 * that is merely switched off. Starting at "action counts, nothing else does"
 * instead puts the reader in the position the unit is about: a perfectly
 * sensible-looking setting whose single recommendation is the one film they
 * said they would walk out of.
 */
export const DEFAULT_DIALS: Dials = [1, 0, 0];
export const DEFAULT_BEND = true;

/** One setting that gets all six right, used by the prose and the tests. */
export const WORKED_DIALS: Dials = [0.8, -1.8, 1.1];

/**
 * Rounds to the slider's own resolution, so 0.30000000000000004 never lands.
 *
 * Dividing by the step and multiplying back leaves its own float dust
 * (`-0.7000000000000001`), so the round trip goes through the reciprocal
 * instead — which is a whole number here, and exact.
 */
const DIAL_GRAIN = 1 / DIAL_STEP;

export function clampDial(value: number): number {
  const inside = Math.min(MAX_DIAL, Math.max(MIN_DIAL, value));
  return Math.round(inside * DIAL_GRAIN) / DIAL_GRAIN;
}

export function clampDials(dials: Dials): Dials {
  return [clampDial(dials[0]), clampDial(dials[1]), clampDial(dials[2])];
}

/** Every setting the reader can actually reach on one dial. */
export const DIAL_VALUES: readonly number[] = Array.from(
  { length: Math.round((MAX_DIAL - MIN_DIAL) / DIAL_STEP) + 1 },
  (_, index) => clampDial(MIN_DIAL + index * DIAL_STEP),
);

/**
 * The bend itself: below zero, report nothing; above it, report the total.
 *
 * This is the one nearly every network built today uses. Its formal name is
 * ReLU, and the name is grander than the arithmetic — there is a single corner
 * in it, at zero, and that corner is the whole subject of this unit.
 */
export function bend(total: number): number {
  return Math.max(0, total);
}

/** What one tuned neuron adds up, before anything is done to the total. */
export function detectorTotal(detector: Detector, film: Film): number {
  return (
    detector.onAction * film.action +
    detector.onBuzz * film.buzz +
    detector.onLength * film.length +
    detector.bias
  );
}

/** What it passes on: bent, or straight through when the bend is switched off. */
export function detectorOutput(
  detector: Detector,
  film: Film,
  bendOn: boolean,
): number {
  const total = detectorTotal(detector, film);
  return bendOn ? bend(total) : total;
}

/** The last neuron's total for one film. Above zero means recommend. */
export function filmTotal(film: Film, dials: Dials, bendOn: boolean): number {
  const setting = clampDials(dials);

  return (
    DETECTORS.reduce(
      (running, detector, index) =>
        running + detectorOutput(detector, film, bendOn) * setting[index],
      0,
    ) + OUTPUT_BIAS
  );
}

export function recommends(film: Film, dials: Dials, bendOn: boolean): boolean {
  return filmTotal(film, dials, bendOn) > 0;
}

/** How many of the six the machine and the reader currently agree on. */
export function agreement(dials: Dials, bendOn: boolean): number {
  return FILMS.filter((film) => recommends(film, dials, bendOn) === film.watch)
    .length;
}

/**
 * What a single neuron reading the three raw facts would have to weigh them by
 * to behave exactly like the whole stack — which only exists when the bend is
 * off, because that is the only time the stack *is* a single weighted sum.
 *
 * The arithmetic is one line: multiply each tuned neuron's weights by the dial
 * sitting on it and add them up. Doing it in the open is the point. A reader
 * who has watched three neurons flatten into three numbers and a bias does not
 * have to take the collapse on trust.
 */
export interface CollapsedNeuron {
  readonly onAction: number;
  readonly onBuzz: number;
  readonly onLength: number;
  readonly bias: number;
}

export function collapse(dials: Dials): CollapsedNeuron {
  const setting = clampDials(dials);
  const weigh = (pick: (detector: Detector) => number): number =>
    DETECTORS.reduce(
      (running, detector, index) => running + pick(detector) * setting[index],
      0,
    );

  return {
    onAction: weigh((detector) => detector.onAction),
    onBuzz: weigh((detector) => detector.onBuzz),
    onLength: weigh((detector) => detector.onLength),
    bias: weigh((detector) => detector.bias) + OUTPUT_BIAS,
  };
}

/** What that single neuron says about one film. */
export function collapsedTotal(neuron: CollapsedNeuron, film: Film): number {
  return (
    neuron.onAction * film.action +
    neuron.onBuzz * film.buzz +
    neuron.onLength * film.length +
    neuron.bias
  );
}

/* ------------------------------------------------------------------------ *
 * The curve: the machine's total for the three films that differ only in
 * action, followed all the way along that fact.
 * ------------------------------------------------------------------------ */

/** The word of mouth and running time the three trap films share. */
export const CURVE_BUZZ = 7;
export const CURVE_LENGTH = 6;
export const MIN_ACTION = 0;
export const MAX_ACTION = 10;

export interface CurvePoint {
  readonly action: number;
  readonly total: number;
}

export function totalAtAction(
  action: number,
  dials: Dials,
  bendOn: boolean,
): number {
  return filmTotal(
    {
      id: 'ninth-signal',
      action,
      buzz: CURVE_BUZZ,
      length: CURVE_LENGTH,
      watch: true,
    },
    dials,
    bendOn,
  );
}

/**
 * The corners of the curve, exactly — not a sampled approximation.
 *
 * Between corners the total is straight, because every part of the machine is a
 * multiplication and an addition. The only thing that can put a corner in it is
 * a neuron whose bend switches on partway along, and there is a closed form for
 * where that happens. Drawing the corners rather than sampling near them is
 * what makes the shape honest: with the bend off this returns exactly two
 * points, which is the entire lesson stated as a data structure.
 */
export function curveVertices(dials: Dials, bendOn: boolean): CurvePoint[] {
  const corners: number[] = [];

  if (bendOn) {
    for (const detector of DETECTORS) {
      if (detector.onAction === 0) continue;

      const rest =
        detector.onBuzz * CURVE_BUZZ +
        detector.onLength * CURVE_LENGTH +
        detector.bias;
      const where = -rest / detector.onAction;

      if (where > MIN_ACTION && where < MAX_ACTION) corners.push(where);
    }
  }

  const actions = [MIN_ACTION, ...corners, MAX_ACTION].sort(
    (left, right) => left - right,
  );

  return actions.map((action) => ({
    action,
    total: totalAtAction(action, dials, bendOn),
  }));
}

/* ------------------------------------------------------------------------ *
 * How well the reader could possibly do.
 * ------------------------------------------------------------------------ */

interface Ceilings {
  readonly withBend: number;
  readonly withoutBend: number;
}

let ceilings: Ceilings | null = null;

/**
 * Sweeps the whole grid once. The per-film neuron outputs are worked out first
 * and reused, because the alternative — going through `agreement` 68,921 times
 * over — is a tenth of a second of arithmetic on the reader's main thread for
 * an answer that was already decided when the films were written down.
 */
function computeCeilings(): Ceilings {
  const rows = FILMS.map((film) => ({
    watch: film.watch,
    bent: DETECTORS.map((detector) => detectorOutput(detector, film, true)),
    straight: DETECTORS.map((detector) =>
      detectorOutput(detector, film, false),
    ),
  }));

  let withBend = 0;
  let withoutBend = 0;

  for (const first of DIAL_VALUES) {
    for (const second of DIAL_VALUES) {
      for (const third of DIAL_VALUES) {
        let bentAgreed = 0;
        let straightAgreed = 0;

        for (const row of rows) {
          const bentTotal =
            row.bent[0] * first +
            row.bent[1] * second +
            row.bent[2] * third +
            OUTPUT_BIAS;
          const straightTotal =
            row.straight[0] * first +
            row.straight[1] * second +
            row.straight[2] * third +
            OUTPUT_BIAS;

          if (bentTotal > 0 === row.watch) bentAgreed += 1;
          if (straightTotal > 0 === row.watch) straightAgreed += 1;
        }

        if (bentAgreed > withBend) withBend = bentAgreed;
        if (straightAgreed > withoutBend) withoutBend = straightAgreed;
      }
    }
  }

  return { withBend, withoutBend };
}

/**
 * The best any setting of the three dials can manage, found by trying all
 * 68,921 of them.
 *
 * Computed rather than written down, so the readout can state a ceiling as a
 * fact about this machine instead of a promise. Memoised because the reader
 * moves a dial far more often than the answer changes, which is never.
 */
export function bestAgreement(bendOn: boolean): number {
  ceilings ??= computeCeilings();
  return bendOn ? ceilings.withBend : ceilings.withoutBend;
}

export type Verdict = 'all-six' | 'more-is-more' | 'nearly' | 'astray';

export function verdictFor(dials: Dials, bendOn: boolean): Verdict {
  const agreed = agreement(dials, bendOn);
  if (agreed === FILMS.length) return 'all-six';

  const relentless = FILMS.find((film) => film.id === 'blast-radius');
  if (relentless && recommends(relentless, dials, bendOn))
    return 'more-is-more';

  if (agreed === FILMS.length - 1) return 'nearly';
  return 'astray';
}
