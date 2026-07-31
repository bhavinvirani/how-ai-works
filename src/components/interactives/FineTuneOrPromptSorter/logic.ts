/**
 * Pure logic for FineTuneOrPromptSorter (§3.3).
 *
 * The instrument teaches one thing: the line between fine-tuning and prompting
 * is not how important a job is or how much of it there is, it is whether the
 * machine has to *do* something or has to be *right* about something. Behaviour
 * can live in dials. Facts cannot, because a training run files nothing
 * anywhere retrievable.
 *
 * WHY A SORTER RATHER THAN A DEMONSTRATION. Reading "fine-tuning changes
 * behaviour, not knowledge" produces agreement without understanding — the
 * sentence is easy and every reader nods at it. Being wrong about a returns
 * policy produces understanding. So the reader commits to a pile for each job
 * before any verdict exists, and three of the eight jobs are deliberately not
 * what they look like.
 *
 * THE THREE ARE CHOSEN, NOT SCATTERED. `returns-policy` and `handoff` come out
 * of the same document and go into opposite piles — the contents of a policy
 * are facts, the conduct a policy demands is behaviour. `fixed-format` is the
 * honest one, where both piles genuinely work. Together they are the whole
 * rule, which is why the count is pinned in `logic.test.ts` rather than left to
 * whoever edits this file next.
 *
 * Nothing here is random and nothing reads a clock. The same eight jobs, in the
 * same order, with the same verdicts, on every visit.
 */

/** The two piles the reader sorts into. */
export type Pile = 'dials' | 'prompt';

/**
 * Fixed order, because it is the order the two segments appear in and the order
 * the copy assumes. Ordering that matters is written down once.
 */
export const PILES: readonly Pile[] = ['dials', 'prompt'];

/**
 * Where a job actually belongs. `either` is not a hedge — it is the honest
 * answer for a job where both routes work and the choice is about cost rather
 * than about kind.
 */
export type Belonging = Pile | 'either';

export type JobId =
  | 'house-style'
  | 'returns-policy'
  | 'weekly-prices'
  | 'fixed-format'
  | 'hedging'
  | 'handoff'
  | 'on-call'
  | 'past-tickets';

export interface Job {
  readonly id: JobId;
  /** The pile this job belongs in once you have the idea. */
  readonly belongs: Belonging;
  /**
   * The pile the job's phrasing points at — where a reader who has read the
   * rule but not absorbed it will put it. Equal to `belongs` for the five
   * straightforward jobs, and different for the three that carry the lesson.
   */
  readonly firstInstinct: Pile;
}

/**
 * Eight jobs a team might genuinely bring to a model.
 *
 * The order alternates: every second job is one of the three that are not what
 * they look like, so the reader never gets a run of easy ones long enough to
 * stop thinking, and never a run of hard ones long enough to feel tricked.
 */
export const JOBS: readonly Job[] = [
  { id: 'house-style', belongs: 'dials', firstInstinct: 'dials' },
  { id: 'returns-policy', belongs: 'prompt', firstInstinct: 'dials' },
  { id: 'weekly-prices', belongs: 'prompt', firstInstinct: 'prompt' },
  { id: 'fixed-format', belongs: 'either', firstInstinct: 'dials' },
  { id: 'hedging', belongs: 'dials', firstInstinct: 'dials' },
  { id: 'handoff', belongs: 'dials', firstInstinct: 'prompt' },
  { id: 'on-call', belongs: 'prompt', firstInstinct: 'prompt' },
  { id: 'past-tickets', belongs: 'prompt', firstInstinct: 'prompt' },
];

export function jobById(id: JobId): Job {
  const found = JOBS.find((job) => job.id === id);
  if (found === undefined) throw new Error(`no job called ${id}`);
  return found;
}

/**
 * True when the verdict is not the pile the job's phrasing points at.
 *
 * Derived rather than stored as a flag of its own, so that a later edit to a
 * job's verdict cannot leave a stale "this one is tricky" marker behind. A job
 * whose answer is `either` is always surprising, because no first instinct ever
 * lands on "both of these work".
 */
export const isSurprising = (job: Job): boolean =>
  job.belongs !== job.firstInstinct;

export const SURPRISING_JOBS: readonly Job[] = JOBS.filter(isSurprising);

/** What the reader is told about the choice they just made. */
export type Mark = 'right' | 'wrong' | 'both';

export function markFor(job: Job, chosen: Pile): Mark {
  if (job.belongs === 'either') return 'both';
  return job.belongs === chosen ? 'right' : 'wrong';
}

/** Both piles count as right for the one job where both piles work. */
export const isRight = (job: Job, chosen: Pile): boolean =>
  markFor(job, chosen) !== 'wrong';

/** What the reader has sorted so far. Absent means not yet answered. */
export type Answers = Readonly<Partial<Record<JobId, Pile>>>;

export interface Tally {
  readonly answered: number;
  readonly right: number;
  readonly total: number;
}

export function tally(answers: Answers): Tally {
  let answered = 0;
  let right = 0;

  for (const job of JOBS) {
    const chosen = answers[job.id];
    if (chosen === undefined) continue;

    answered += 1;
    if (isRight(job, chosen)) right += 1;
  }

  return { answered, right, total: JOBS.length };
}

const answersFrom = (choose: (job: Job) => Pile): Answers => {
  const answers: Partial<Record<JobId, Pile>> = {};
  for (const job of JOBS) answers[job.id] = choose(job);
  return answers;
};

/**
 * Every job put in the pile its phrasing points at.
 *
 * Exported because the unit quotes what this scores — sorting entirely on
 * instinct gets six of the eight — and a claim the prose makes about the
 * instrument should be arithmetic the build can check, not a number somebody
 * counted once by hand.
 */
export const FIRST_INSTINCT: Answers = answersFrom((job) => job.firstInstinct);

/** Every job dumped in one pile, which is the other thing readers try. */
export const everyJobIn = (pile: Pile): Answers => answersFrom(() => pile);
