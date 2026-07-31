/**
 * Words for AgentTraceExplorer. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text here
 * rather than in `src/copy/en.ts` or in required props.
 *
 * `TURN_TEXT`, `CLAIM_TEXT` and the rest are `Record`s over the id unions in
 * `logic.ts`, so adding a turn or a statement without writing words for it fails
 * to compile. A trace of unlabelled boxes would be a flowchart; this is supposed
 * to be a machine thinking out loud and then doing something.
 *
 * NO TOKEN COUNT IS WRITTEN OUT HERE. Every number the panel reports is a
 * formatter fed from `logic.ts`, so editing what a turn costs moves the readout
 * instead of leaving a stale figure sitting in a sentence.
 *
 * The shop, the street and the supplier are invented. Nothing here is a claim
 * about a real business, which matters more than usual in an instrument whose
 * whole subject is a machine asserting things nobody checked.
 */
import type { ClaimId, EndingKind, ResultId, ToolId, TurnId } from './logic';

const groupDigits = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const tokens = (value: number): string =>
  `${groupDigits(value)} ${value === 1 ? 'token' : 'tokens'}`;

interface ToolWords {
  /** How the tool is named in a call, in the mono face. */
  readonly name: string;
  /** What your code does when the model asks for it. */
  readonly does: string;
}

/**
 * Six tools, of which two change something outside the shop and four only read.
 *
 * The split is deliberate and it is the reader's first sight of the practical
 * advice: most of what an agent needs is reading, and reading is the part that
 * cannot go wrong in a way you have to apologise for.
 */
export const TOOL_TEXT: Record<ToolId, ToolWords> = {
  bill: { name: 'bill', does: 'read what the account was charged, by month' },
  readings: {
    name: 'readings',
    does: 'read meter readings for a period, or day by day',
  },
  equipment: {
    name: 'equipment',
    does: 'read the shop’s equipment log — what was installed, when',
  },
  tariff: {
    name: 'tariff',
    does: 'read what the supplier charges, what it charged before, and what else is on offer',
  },
  switch: {
    name: 'switch',
    does: 'move the account onto a different tariff',
  },
  email: {
    name: 'email',
    does: 'send an email from the shop’s address',
  },
};

interface TurnWords {
  /** Its own line before it acts — short, first person, no audience. */
  readonly intent: string;
  /** The call it asked for. Empty when the turn produced an answer instead. */
  readonly action: string;
  /** What came back. Empty for the turn whose result the reader chooses. */
  readonly result: string;
}

export const TURN_TEXT: Record<TurnId, TurnWords> = {
  open: {
    intent: 'I have no numbers yet. Start with what was actually charged.',
    action: 'bill(months: March, April)',
    result: 'March £412. April £838. Same address, same meter.',
  },

  /**
   * The branch. Its result is not written here because it is the one thing the
   * reader controls — see `METER_RESULT_TEXT` below.
   */
  meter: {
    intent:
      'A bill can double two ways — twice as much used, or twice as much charged for each unit. The meter says which.',
    action: 'readings(period: 1 March to 30 April)',
    result: '',
  },

  freezer: {
    intent:
      'Usage really did double, so something in the shop is drawing power that was not drawing it before. The equipment log will say what changed.',
    action: 'equipment(changes since: 1 March)',
    result: '3 April — a second display freezer delivered and switched on.',
  },
  daily: {
    intent:
      'A delivery date is not proof. If it is the freezer, the extra use will show on the days the shop is shut.',
    action: 'readings(period: April, by: day)',
    result:
      'Daily use level all month, Sundays included. The shop is closed on Sundays.',
  },
  'say-freezer': {
    intent:
      'That is enough to say what happened, and nothing here needs an action I cannot undo.',
    action: '',
    result: '',
  },

  rate: {
    intent:
      'Usage barely moved, so what changed is the price rather than anything in the shop.',
    action: 'tariff(history)',
    result:
      'Fixed rate ended 31 March. From 1 April the account is on the standard variable rate, 2.1× the fixed unit price.',
  },
  offers: {
    intent:
      'That accounts for the bill. The goal says put it right, so I need to know what else is available.',
    action: 'tariff(offers)',
    result:
      'Two fixed offers open to this account, both below the standard variable rate.',
  },
  terms: {
    intent:
      'Before recommending a move I should know what leaving the current rate costs.',
    action: 'tariff(terms: current)',
    result: 'Standard variable rate. No exit fee, 28 days’ notice.',
  },
  'switch-held': {
    intent:
      'The cheaper of the two offers is the right move, and there is no penalty for making it.',
    action: 'switch(to: fixed, 24 months)',
    result: 'Not run.',
  },

  march: {
    intent:
      'With no April reading I cannot compare the two months. March is the nearest actual figure there is.',
    action: 'readings(period: March)',
    result: 'March 1,940 kWh. Actual reading.',
  },
  'send-dispute': {
    intent:
      'March is what I have, and nothing suggests April was any different, so the estimate is the thing that is wrong.',
    action: 'email(to: supplier, subject: April estimate disputed)',
    result: 'Sent.',
  },
};

/** The short label on the chooser. Three of these share one row on a phone. */
export const RESULT_LABEL: Record<ResultId, string> = {
  doubled: 'usage doubled',
  flat: 'usage unchanged',
  missing: 'no reading',
};

/**
 * The one line the reader changes.
 *
 * The third is not an error message. It is an ordinary, well-formed answer that
 * happens to contain no reading — which is exactly why nothing downstream
 * treats it as a problem.
 */
export const METER_RESULT_TEXT: Record<ResultId, string> = {
  doubled: 'March 1,940 kWh. April 3,880 kWh. Both actual readings.',
  flat: 'March 1,940 kWh. April 1,975 kWh. Both actual readings.',
  missing: 'No reading recorded for April. The April bill is an estimate.',
};

/**
 * The statements each run finished with, one sentence each.
 *
 * Split into separate statements rather than left as a paragraph because
 * "which part of this rests on something?" is a question about parts. A
 * conclusion is rarely wholly invented; it is usually three sound sentences
 * with a fourth sitting quietly among them.
 */
export const CLAIM_TEXT: Record<ClaimId, string> = {
  'a-usage': 'April used 3,880 kWh against March’s 1,940.',
  'a-freezer': 'A second display freezer was switched on on 3 April.',
  'a-sundays':
    'Daily use is level across the Sundays the shop is closed, which is a freezer running, not trading.',

  'b-usage': 'Usage barely moved — 1,975 kWh in April against 1,940 in March.',
  'b-price':
    'The fixed rate ended on 31 March, and the rate since is 2.1 times the unit price.',
  'b-offers': 'Two cheaper fixed offers are open to this account.',
  'b-exit': 'There is no exit fee for leaving the current rate.',

  'c-march': 'March usage was 1,940 kWh.',
  'c-april': 'April’s usage was no different from March’s.',
  'c-estimate': 'The April estimate of £838 is far too high.',
};

interface EndingWords {
  /** How the last turn is introduced. */
  readonly lead: string;
  /** One sentence on what that ending was, and what decided it. */
  readonly note: string;
}

export const ENDING_TEXT: Record<ResultId, EndingWords> = {
  doubled: {
    lead: 'It asked for no tool. It said this instead:',
    note: 'It found an explanation that needed nothing doing, so nothing was done. That was available to it because the shop turned out to have a freezer problem, not because the agent was being careful.',
  },
  flat: {
    lead: 'It asked to switch the tariff. Your code would not run that, so what reached a person was this:',
    note: 'The tool named switch is on the held list and this stopped in front of it. That list is a line you wrote before the run started — nothing here was worked out by the model.',
  },
  missing: {
    lead: 'It asked to send an email, your code sent it, and the letter said this:',
    note: 'The tool named email is not on the held list, so nothing paused and nobody was asked. Switching a tariff can be switched back. A letter to the supplier accusing them of over-estimating cannot be unsent.',
  },
};

export const ENDING_TAG: Record<EndingKind, string> = {
  answered: 'the run ended by answering',
  held: 'the run ended by stopping for a person',
  acted: 'the run ended by doing something',
};

/** One sentence per ending, for the live region. */
export const ENDING_READOUT: Record<EndingKind, string> = {
  answered: 'It finished by answering, and took no action in the world at all.',
  held: 'It finished by asking for a tool your code holds back, so a person now has the decision.',
  acted:
    'It finished by doing something. Nothing asked first, because nothing was set up to ask.',
};

export const TEXT = {
  goalLabel: 'The goal it was given',
  goal: 'Find out why the electricity bill for the shop at 14 Fenwick Row doubled last month, and put it right.',

  toolsLabel: 'The tools it may ask for',
  toolsNote:
    'It cannot run any of them. It can only write the name of one, and your code decides what happens next.',
  heldTag: 'held — needs a person',

  resultLabel: 'What came back from the meter on turn 2',
  turnsLabel: 'Turns taken',
  turnsOf: (turns: number, total: number) =>
    `${String(turns)} of ${String(total)}`,

  /** Where this row sits in the run. */
  turn: (position: number) => `turn ${String(position)}`,

  decidedLabel: 'it decided',
  ranLabel: 'so your code ran',
  answeredLabel: 'it asked for no tool',
  refusedLabel: 'your code refused to run this',
  cameBackLabel: 'and this came back',

  /** Printed against every turn, because the growth is half the lesson. */
  reads: (amount: number) => `reads ${tokens(amount)}`,

  restsOn: 'rests on something that came back',
  restsOnNothing: 'nothing that came back supports this',

  /** Before the changed result is on screen there is nothing to see change. */
  beforeBranch: (shared: number) =>
    `The first ${String(shared)} turns are the same whichever result you choose, because nothing had come back yet for a plan to depend on. Keep stepping.`,

  midRun: (turn: number, total: number, reads: number) =>
    `Turn ${String(turn)} of ${String(total)}. It is reading ${tokens(reads)} to decide what to do next, and whatever comes back is added to that.`,

  cost: (total: number, multiple: number) =>
    `Across the whole run it read ${tokens(total)} — about ${String(multiple)} times what this same goal would have cost asked once and answered once.`,

  allSound:
    'Every statement it finished with rests on something that came back.',

  floating: (count: number) =>
    count === 1
      ? 'One of the statements it finished with rests on nothing that came back.'
      : `${String(count)} of the statements it finished with rest on nothing that came back.`,

  /**
   * The honest correction about size and about what is real here, kept next to
   * the thing that prompts it.
   */
  scaleNote:
    'The trace is written down rather than produced by a model — a real run would word things differently every time, and its context would run to tens of thousands of tokens rather than hundreds. What is not simplified is the shape: one turn, one choice, one result added to everything the next turn has to read.',
} as const;
