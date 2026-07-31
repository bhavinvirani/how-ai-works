/**
 * Words for EvalScoreboard. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 *
 * The ten messages are the instrument. A reader who cannot see what a customer
 * wrote has no way to judge whether a queue is the right one, and then the
 * scoreboard is a number changing for reasons they have to take on trust —
 * which is the exact habit this unit exists to break.
 */
import type { CaseId, Change, Queue, Tally, Verdict, VersionId } from './logic';

/**
 * What each customer actually wrote.
 *
 * Three of them describe something broken while asking for something that is
 * not a refund. That is not a trick: it is the ordinary texture of a support
 * inbox, and it is the reason a rule written on the word "damage" does harm.
 */
export const MESSAGES: Record<CaseId, string> = {
  mug: 'The mug arrived in three pieces. I do not want another one, I just want my money back.',
  tracking:
    'Tracking has not moved since Thursday. Is the order still coming or should I give up on it?',
  courier:
    'The box turned up flattened. Nothing inside is damaged, but somebody should have a word with the courier.',
  glasses:
    'Two of the six glasses were broken. Could you send two more? I will keep the rest.',
  shade:
    'The lamp itself is fine but the shade came cracked. Can I get hold of just the shade?',
  address:
    'We have moved house. Can you update the address you have got on file before my next order?',
  'double-charge':
    'I have been charged twice for order 4471. I only meant to pay once.',
  'late-gift':
    'This was meant to be a birthday present on Saturday and it still is not here.',
  'wrong-item':
    'You have sent me the blue one. I ordered the green. I would like the green please.',
  password:
    'The site will not let me sign in and the reset email never turns up.',
};

/** The queue names as they appear on the scoreboard. */
export const QUEUE_NAMES: Record<Queue, string> = {
  refund: 'refund',
  replacement: 'replacement',
  delivery: 'delivery',
  account: 'account',
};

/**
 * The four instructions, written as the lines somebody added.
 *
 * The first three share their opening line, because that is what patching is:
 * the thing already running, plus a sentence. The fourth shares nothing with
 * it, which is the visible difference between fixing an instruction and
 * appending to one.
 */
export const INSTRUCTIONS: Record<VersionId, readonly string[]> = {
  shipped: [
    'Read the customer message and put it in the right queue — refund, replacement, delivery or account.',
  ],

  keyword: [
    'Read the customer message and put it in the right queue — refund, replacement, delivery or account.',
    'If the customer mentions damage, breakage or anything arriving in poor condition, put it in refund.',
  ],

  longer: [
    'Read the customer message and put it in the right queue — refund, replacement, delivery or account.',
    'If the customer mentions damage, breakage or anything arriving in poor condition, put it in refund.',
    'If the customer asks for a replacement item or a missing part, put it in replacement instead.',
  ],

  rewrite: [
    'Read the customer message and decide what the customer wants to happen next. That is the queue.',
    'Money back is refund. The goods put right — sent again, swapped, a part supplied — is replacement. Where an order is, or how it travelled, is delivery. Their details or their sign-in is account.',
    'Label what they are asking for, not what they are describing. A broken item is not automatically a refund.',
  ],
};

/** The four segments, named for what somebody did rather than for a number. */
export const VERSION_LABELS: Record<VersionId, string> = {
  shipped: 'As shipped',
  keyword: 'Add a rule',
  longer: 'Add another',
  rewrite: 'Start again',
};

/** Said in words, so nothing on a row depends on the tick alone. */
export const VERDICT_WORDS: Record<Verdict, string> = {
  pass: 'passes',
  fail: 'fails',
};

/** Decorative twin of the word above it, and hidden from screen readers. */
export const VERDICT_MARKS: Record<Verdict, string> = {
  pass: '✓',
  fail: '✗',
};

/** The badge on a row this version moved. Empty where nothing moved. */
export const CHANGE_WORDS: Record<Change, string> = {
  unchanged: '',
  fixed: 'this version fixed it',
  broken: 'this version broke it',
};

const REPORTED_PASSES =
  'The message that was forwarded to you this morning now goes where it should, and on that evidence the change is finished. It is the only check most changes to an instruction ever get.';

const REPORTED_FAILS =
  'The message that was forwarded to you this morning still goes to the wrong queue. It is the reason anybody is looking at this instruction at all.';

const UNTOUCHED =
  'The one that fails is the message the customer wrote in about. Everything else here was already going to the right queue this morning, which is why nobody had touched the instruction.';

export const TEXT = {
  versionLabel: 'Which version of the instruction to run',

  instructionHeading: 'The instruction the system runs on',

  onlyReportedLabel: 'Only run the case that was reported',
  onlyReportedDescription:
    'Off, it runs a set of ten. A real one is twenty to fifty cases; this one is ten so that you can read every message on it.',

  setHeading: 'The set',
  queuesNote:
    'Four queues, in the words the shop uses. refund is money back, replacement is the goods put right, delivery is anything about where an order is or how it travelled, account is details and sign-in.',

  expectedLabel: 'should go to',
  gotLabel: 'went to',

  /**
   * The whole readout, in one sentence built from the tally, so that an edit to
   * the cases changes the words rather than leaving a stale number behind.
   */
  score: (tally: Tally): string => {
    const { shown, passed, fixed, broken, baselinePassed } = tally;
    const head = `${String(passed)} of ${String(shown)} pass.`;

    if (shown === 1) {
      return `${head} ${passed === 1 ? REPORTED_PASSES : REPORTED_FAILS}`;
    }

    if (fixed === 0 && broken === 0) return `${head} ${UNTOUCHED}`;

    const moved =
      broken === 0
        ? `${String(fixed)} fixed, and nothing that used to pass now fails.`
        : `${String(fixed)} fixed, and ${String(broken)} that used to pass now ${
            broken === 1 ? 'fails' : 'fail'
          }.`;

    if (passed < baselinePassed) {
      return `${head} ${moved} That is ${String(
        baselinePassed - passed,
      )} worse than the instruction you started with, and every one of those ${String(
        broken,
      )} was written down in this file before you touched anything.`;
    }

    if (passed === baselinePassed) {
      return `${head} ${moved} The same score as the instruction you started with, and not the same ${String(
        passed,
      )}. One number, two different systems.`;
    }

    return `${head} ${moved} Better than the instruction you started with — and you can say exactly which case moved, to somebody who was not in the room.`;
  },
} as const;
