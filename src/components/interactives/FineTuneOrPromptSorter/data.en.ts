/**
 * The eight jobs, and the reason each one lands where it lands. English, and
 * deliberately separated from both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts` — see the header of
 * `../SpamRuleWriter/data.en.ts`. Short version: the jobs below ARE the
 * teaching material, chrome copy lives in `src/copy/en.ts`, and an instrument
 * with zero required props cannot demand that every MDX author pass it eight
 * support tickets.
 *
 * The verdicts carry more weight here than in most instruments. A sorter that
 * only says "wrong pile" teaches nothing at all — the whole value is in the
 * sentence that says why, arriving in the second after the reader has committed
 * and can no longer pretend they would have known.
 */
import type { JobId, Mark, Pile } from './logic';

/**
 * Each job is the legend of its own group of radio buttons, so it has to read
 * as a request somebody made rather than as a category. "The price list, which
 * pricing changes on Monday mornings" is a request; "volatile data" is a label
 * that gives the answer away.
 */
export const JOB_TEXT: Record<JobId, string> = {
  'house-style':
    'Every reply should read like your team wrote it — short sentences, no exclamation marks, and never the word "simply".',
  'returns-policy':
    'Your sixty-page returns and warranty policy, so the assistant can answer questions about it.',
  'weekly-prices':
    'The price list, which the pricing team rewrites on Monday mornings.',
  'fixed-format':
    'Every answer comes back as the same three fields in the same order, so the system downstream can read it.',
  hedging:
    'Answers that hedge where hedging is warranted — "usually", "in most cases" — instead of stating everything flatly.',
  handoff:
    'Never guess at a dose. Say so, and hand the conversation to a pharmacist, even when the customer asks a fourth time.',
  'on-call': 'Which engineer is on call tonight.',
  'past-tickets':
    'This customer’s last four support tickets, so the reply picks up where the previous one left off.',
};

/**
 * Verb phrases rather than nouns, because the reader is choosing an action.
 * "Dials" and "prompt" are both the unit's words by the time they get here.
 */
export const PILE_LABELS: Record<Pile, string> = {
  dials: 'Change the dials',
  prompt: 'Put it in the prompt',
};

/**
 * The tag above each verdict. These are the second cue that keeps the result
 * from being carried by a tint alone (hard rule 9), and the only version a
 * screen reader gets from the row itself.
 */
export const MARK_LABELS: Record<Mark, string> = {
  right: 'where it belongs',
  wrong: 'the other pile',
  both: 'either pile works',
};

/**
 * Written as one whole explanation per job rather than a shared template with
 * the job's name slotted in, so translating means rewriting eight paragraphs
 * rather than reassembling eight sentences — and so each one can say the
 * specific thing that job is for.
 */
export const VERDICTS: Record<JobId, string> = {
  'house-style':
    'A way of writing is a habit, and habits are the one thing dials hold well. You could paste the style guide into every message instead, and it would mostly work — you would just be paying for those instructions on every single call, and watching them slip once a conversation runs long.',
  'returns-policy':
    'The one almost everybody gets wrong. A policy document feels like something the assistant ought to know, so it feels like training material. But its contents are facts, and a training run does not file a fact anywhere you can read back, correct or quote. Fetch the clause that matters and put it in the prompt, and the answer can cite it.',
  'weekly-prices':
    'Anything with a date attached goes in the prompt. Bake Monday’s prices into the dials and by Tuesday you own a model that is confidently, untraceably wrong, and the only repair is another training run.',
  'fixed-format':
    'Both piles work, which is why this one is in the set. Three worked examples in the prompt pin a format nearly as well as training does, and rewriting them takes as long as saving a file. Training wins only at volume, when the same format is produced millions of times a day and those examples have started to cost real money.',
  hedging:
    'Knowing when to hedge is a manner, not a fact. There is no list of things to be unsure about — there is a way of answering, and a way of answering is exactly what a few thousand examples can shift.',
  handoff:
    'This one reads like a policy, which is why it lands in the wrong pile. But nothing here is a fact to look up. It is something the model has to do, every time, including on the fourth message from someone who has become annoyed. An instruction in a prompt is a request, and a request can be argued with. A trained habit is much harder to shift.',
  'on-call':
    'A fact with a shelf life of one night. Nothing about it could survive a training run that takes days to finish.',
  'past-tickets':
    'Different for every customer, and none of it existed when the model was trained. Facts about this particular conversation can only arrive at the moment of asking.',
};

export const TEXT = {
  intro:
    'Eight jobs a team might genuinely bring to a model. Choose a pile for each one — the reason appears as soon as you do, so choosing first is the whole exercise.',

  progress: (answered: number, total: number, right: number) =>
    `${String(answered)} of ${String(total)} sorted, ${String(right)} where they belong so far.`,

  finished: (right: number, total: number) =>
    `All ${String(total)} sorted, ${String(right)} where they belong. The three that are not what they look like are the returns policy, the fixed format and the handoff rule, and one question sorts all three — does the machine have to do this, or be right about this?`,
} as const;
