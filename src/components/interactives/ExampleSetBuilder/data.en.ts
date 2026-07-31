/**
 * The booking inbox, the example set, and what comes back for each of the
 * three held-back requests. English, and deliberately separated from both the
 * logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts`. That file is for UI chrome and says
 * so in its own header: lesson content must never go there. But this is not
 * chrome either — the requests and the replies ARE the teaching material, and
 * an instrument with zero required props (§3.3) cannot demand that every MDX
 * author pass it an inbox. See `../SpamRuleWriter/data.en.ts` for the same
 * argument at more length; this is the established pattern for any instrument
 * that carries its own examples.
 */
import type { Example, Grade, TestMessage } from './logic';

/**
 * The instruction a person writes first, and it is exactly as useless as it
 * sounds. "Our usual format" is a shape, and this is a sentence — which is the
 * whole reason the panel exists.
 */
export const INSTRUCTION =
  'Take each booking request and put it in our usual format.';

/**
 * Four examples, in the order the reader adds them. Each one carries exactly
 * one thing the others do not, which is what lets the panel show that an
 * example teaches whatever is in it and nothing else.
 *
 *   1  the format, entire — separators, order, day abbreviation, 24-hour
 *      clock, and the house code for the small room
 *   2  the second room code
 *   3  the first time that does not land on a whole hour
 *   4  a request that cannot be answered, answered properly
 *
 * BACK and HALL are the codes this made-up community centre's room diary uses.
 * Nothing in the instruction says so and nothing could have been guessed, which
 * is the point of putting private vocabulary in an example rather than in a
 * paragraph.
 */
export const EXAMPLES: readonly Example[] = [
  {
    request: 'Can we have the small room Tuesday, 6 till 8?',
    line: 'BACK · Tue · 18:00–20:00',
  },
  {
    request: 'Choir in the big room Thursday, 7 to 9.',
    line: 'HALL · Thu · 19:00–21:00',
  },
  {
    request: 'Toddler group, small room, Friday, half nine till eleven.',
    line: 'BACK · Fri · 09:30–11:00',
  },
  {
    request: "Any chance of a room next week? It's for a birthday do.",
    line: 'ASK · day and time missing',
  },
];

/**
 * Three requests the example set never saw, one per kind of trouble: one that
 * every example already covers, one that goes outside the range the examples
 * demonstrate, and one that has nothing in it to build a line from.
 *
 * The replies are hand-authored and hand-ordered. They are not a simulation of
 * a model and the unit does not pretend otherwise — but each one is a failure
 * mode that is thoroughly documented in practice, and `logic.test.ts` holds the
 * whole table to the claims the prose makes about it.
 */
export const MESSAGES: readonly TestMessage[] = [
  {
    id: 'plain',
    label: 'Plain',
    request: 'Yoga class, small room, Wednesday 7 till 8.',
    replies: [
      {
        text: 'Room: Small Room | Day: Wednesday | Time: 7pm–8pm',
        grade: 'unusable',
        note: 'A perfectly sensible format, and not yours. The instruction never said what yours was, because a format is a shape and the instruction is a sentence.',
      },
      {
        text: 'BACK · Wed · 19:00–20:00',
        grade: 'usable',
        note: 'One finished example, and every detail is right — the middle dots, the order, the three-letter day, the 24-hour clock, and the fact that the small room is called BACK in this diary. Nobody described any of that.',
      },
      {
        text: 'BACK · Wed · 19:00–20:00',
        grade: 'usable',
        note: 'Unchanged. A second example buys nothing on a request this plain, which is worth noticing before you reach for a fifth.',
      },
      {
        text: 'BACK · Wed · 19:00–20:00',
        grade: 'usable',
        note: 'Still unchanged, and now costing three examples on every call to produce the same line it produced after one.',
      },
      {
        text: 'BACK · Wed · 19:00–20:00',
        grade: 'usable',
        note: 'Still unchanged. Everything after the first example is being bought for the requests that are not this one.',
      },
    ],
  },
  {
    id: 'unusual',
    label: 'Unusual',
    request: 'Can the choir have the big room on Friday, half seven till nine?',
    replies: [
      {
        text: 'Big room, Friday 19:30–21:00',
        grade: 'unusable',
        note: 'Right about the booking, and in a different shape from the one it chose for the yoga request a moment ago. Step between the three requests at zero examples and it invents a fresh format for each.',
      },
      {
        text: 'hall · Fri · 19:00–21:00',
        grade: 'wrong',
        note: 'Two mistakes, and both are copied from the single example it was shown. It has never seen the big room, so it guessed a code — lowercase, and not the one the diary uses. And every time it has seen landed on the hour, so half seven became seven.',
      },
      {
        text: 'HALL · Fri · 19:00–21:00',
        grade: 'wrong',
        note: 'The room code is right now, because the second example contains it. The half hour is still gone. It is not rounding to be helpful; it is reproducing the span of values you showed it, and every time inside that span was a whole hour.',
      },
      {
        text: 'HALL · Fri · 19:30–21:00',
        grade: 'usable',
        note: 'The third example is the first one with a half hour in it, and that is the entire reason this line is now right. An example does not teach the format twice. It teaches whatever is in it that the others did not have.',
      },
      {
        text: 'HALL · Fri · 19:30–21:00',
        grade: 'usable',
        note: 'Untouched by the fourth example, which is the point of it. That one was never for this request.',
      },
    ],
  },
  {
    id: 'unanswerable',
    label: 'Unanswerable',
    request: "Do you have anything free next month? It's for a christening.",
    replies: [
      {
        text: 'Next month is fairly open at the moment. Do you know which date you are after, and roughly how many people?',
        grade: 'unusable',
        note: 'Not a line, and yet it is the right answer. With no pattern to copy it did what the person on the desk would do and asked. Remember this reply — it is the last time it happens.',
      },
      {
        text: 'BACK · Mon · 19:00–21:00',
        grade: 'invented',
        note: 'There is no day in that request, no room and no time. It supplied all three. One example ago the document became a list of finished lines, and a finished line is now the only plausible way to end it.',
      },
      {
        text: 'HALL · Mon · 19:00–21:00',
        grade: 'invented',
        note: 'A different fabrication, equally confident. The second example did not make it more careful about what it does not know. It made it more fluent at inventing.',
      },
      {
        text: 'BACK · Fri · 09:30–11:00',
        grade: 'invented',
        note: 'Read that against the third example. It is the same line, copied out word for word. With nothing in the request to build from, the most plausible continuation is the last thing it saw — and the result is flawlessly formatted, entirely fictional, and invisible to anything checking the shape of the output.',
      },
      {
        text: 'ASK · day and time missing',
        grade: 'usable',
        note: 'One example of a request that cannot be answered, and it stops answering. The model, the instruction and the other three examples are identical to the line above. The escape hatch exists because you demonstrated one.',
      },
    ],
  },
];

/**
 * What a downstream system could do with each kind of reply. Written as
 * sentences rather than adjectives, because these are the second cue that
 * keeps the tinted rows from carrying their meaning in colour alone (hard
 * rule 9), and the only thing a screen reader gets.
 */
export const GRADE_LABELS: Record<Grade, string> = {
  unusable: 'not a line — nothing downstream can read it',
  wrong: 'your format, wrong details',
  invented: 'your format, and a booking nobody asked for',
  usable: 'exactly the line you asked for',
};

export const TEXT = {
  countLabel: 'Examples in the prompt',
  countValue: (count: number): string =>
    count === 1 ? '1 example' : `${String(count)} examples`,

  messageLabel: 'The request it is asked to handle next',

  promptHeading: 'What gets sent',
  replyHeading: 'What comes back',

  /** Written as a function so the whole sentence lives here, not at the call site. */
  cost: (total: number, fromExamples: number): string =>
    fromExamples === 0
      ? `Roughly ${String(total)} tokens go up the wire, and every call sends the whole thing again.`
      : `Roughly ${String(total)} tokens go up the wire, ${String(fromExamples)} of them the examples — and every call sends the whole thing again.`,
} as const;
