/**
 * Words for ThinkingBudget. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 *
 * `STEP_TEXT` and `ANSWER_TEXT` are `Record`s over the id unions in
 * `logic.ts`, so adding a line of working or an outcome without writing words
 * for it fails to compile. A budget bar full of unlabelled blocks would be a
 * chart; this is supposed to be a model thinking out loud.
 *
 * NO NUMBERS ARE WRITTEN OUT HERE except inside the questions themselves,
 * where they are part of what is being asked. Every count the panel reports is
 * a formatter fed from `logic.ts`, so a later edit to a token cost moves the
 * readout instead of leaving a stale figure sitting in a sentence.
 */
import type { AnswerId, QuestionId, StepId } from './logic';

const count = (value: number, singular: string, plural: string): string =>
  `${String(value)} ${value === 1 ? singular : plural}`;

const tokens = (value: number): string => count(value, 'token', 'tokens');

interface AskedWords {
  /** The short label on the chooser. Four of these share one row on a phone. */
  readonly label: string;
  /** The question itself, as somebody would type it. */
  readonly prompt: string;
}

export const QUESTION_TEXT: Record<QuestionId, AskedWords> = {
  rice: {
    label: 'a puzzle',
    prompt:
      'A rice recipe for four people uses 300 g. I am cooking for seven and my bag holds 500 g. Is that enough?',
  },
  capital: {
    label: 'a lookup',
    prompt: 'What is the capital of Australia?',
  },
  polite: {
    label: 'a rewrite',
    prompt: 'Make this less blunt: “Your invoice is late again.”',
  },
  supplier: {
    label: 'an unknown',
    prompt: 'Which of our two suppliers is cheaper — Brightwell or Kesson?',
  },
};

/**
 * The working, line by line, in the voice models actually use when they are
 * writing to themselves: short, first person, no audience.
 */
export const STEP_TEXT: Record<StepId, string> = {
  'rice-per-head': '300 g feeds four people, so that is 75 g each.',
  'rice-times-seven': 'Seven people at 75 g each comes to 525 g.',
  'rice-compare': 'The bag holds 500 g, and 525 g is more than that.',
  'rice-shortfall': '525 minus 500 leaves 25 g I do not have.',

  'capital-restate': 'The question asks for the capital city of Australia.',
  'capital-trap': 'People often answer Sydney, or sometimes Melbourne.',
  'capital-settle': 'The capital is Canberra. Nothing here is disputed.',

  'polite-read': 'This is a complaint about an invoice that is late again.',
  'polite-options':
    'I could soften the opening, or take the blame off the reader.',
  'polite-hedge':
    'Perhaps I should allow for the possibility that there was a good reason.',
  'polite-spiral': 'And offer help, and avoid the word late, and keep it warm.',

  'supplier-frame':
    'I have not been given prices for either of these suppliers.',
  'supplier-assume':
    'Brightwell reads like the larger firm, and larger firms tend to discount.',
  'supplier-settle':
    'On balance, the larger supplier is the safer thing to say.',
};

/**
 * What it says, and one sentence on what just happened.
 *
 * The verdict is the only thing a reader takes away from a setting they spent
 * two seconds on, so it has to name the mechanism rather than grade the
 * answer. "Wrong" teaches nothing; "it never wrote the comparison down"
 * teaches the unit.
 */
interface AnswerWords {
  /** What the model ends up saying. */
  readonly text: string;
  /** One sentence on what just happened, and why. */
  readonly verdict: string;
}

export const ANSWER_TEXT: Record<AnswerId, AnswerWords> = {
  'rice-snap': {
    text: 'Yes — 500 g is plenty for seven.',
    verdict:
      'Wrong, and instant. It never worked out what seven people need, so it compared the bag against the only other number in the question.',
  },
  'rice-partial': {
    text: 'You will need 525 g, so the bag has you covered.',
    verdict:
      'Still wrong, and now wrong in a more convincing way: it has produced the right quantity and drawn the opposite conclusion from it. Half the working is not half an answer.',
  },
  'rice-right': {
    text: 'No — seven people need 525 g, and your bag holds only 500 g.',
    verdict:
      'Right. Nothing inside the machine changed between this and the wrong answer above. It was given room for one more line, and that line was the comparison.',
  },
  'rice-full': {
    text: 'No. Seven people need 525 g and your bag holds 500 g, so you are 25 g short.',
    verdict:
      'Right, with the shortfall as well. That is everything this question had in it; from here on the extra room goes unspent.',
  },

  'capital-right': {
    text: 'Canberra.',
    verdict:
      'Right — and it was right with no room at all. Every line of working above changed nothing whatever about the answer, and everything about the bill.',
  },

  'polite-clean': {
    text: 'Could you let me know when we might expect the invoice? Thank you.',
    verdict:
      'Good, and immediate. There is nothing in this task to work out: the whole job is one sentence, and it wrote one sentence.',
  },
  'polite-mush': {
    text: 'I do hope all is well at your end. I completely understand that these things can slip through, and there is no pressure, but whenever you have a moment it would be lovely to hear roughly when the invoice might be with us.',
    verdict:
      'Worse. Given room to deliberate it deliberated, and every line of that deliberation went into the answer as another hedge. It did not think badly. There was nothing here to think about.',
  },

  'supplier-honest': {
    text: 'I cannot say — you have not given me prices for either.',
    verdict:
      'Good. It says what it has not got, which is the only true answer to a question with no prices in it.',
  },
  'supplier-invented': {
    text: 'Brightwell is likely the cheaper of the two, given its size and the volume discounts that come with it.',
    verdict:
      'Not good. The extra room did not find a price, because there is no price here to find. It found a reason instead — and every line above is real computation, spent building a case for a figure nobody supplied.',
  },
};

export const TEXT = {
  questionLabel: 'The question',
  chooseLabel: 'Ask it',

  roomLabel: 'Room to write before it answers',
  roomDescription:
    'How many tokens of working-out it may produce before committing to an answer. Nothing obliges it to use them all.',
  roomValue: (room: number) => (room === 0 ? 'none at all' : tokens(room)),

  workingLabel: 'What it wrote to itself first',
  noWorking:
    'Nothing. With no room, the answer is the first thing it produces.',
  written: 'written',
  unwritten: 'no room for this line',

  answerLabel: 'What it said',

  /** The mechanism, restated on every setting, because it is the whole unit. */
  produced: (passes: number, working: number, answer: number) =>
    `${tokens(passes)} produced — ${String(working)} of working and ${String(answer)} of answer — and one token is one pass through the whole machine.`,

  multiple: (times: number) =>
    `That is ${times.toFixed(1)}× the passes this same question took with no room at all.`,

  tooTight:
    'The first line of working was longer than the room it was given, so it wrote none of it and answered anyway. A budget too small to finish a thought in buys nothing.',

  cutShort: (unwritten: number) =>
    `It stopped mid-thought: ${count(unwritten, 'line', 'lines')} of working never got written, and unwritten working cannot be used.`,

  spare: (unused: number) =>
    `${tokens(unused)} of the room went unused — it had run out of things to say, not room to say them in.`,

  /**
   * The honest correction about size, kept next to the thing that prompts it.
   * A reader who notices that a hundred tokens is a laughable thinking budget
   * should find the answer here rather than deciding the panel is a toy.
   */
  scaleNote:
    'Real thinking budgets run to thousands of tokens, and the working is usually far longer than the answer. This one is scaled down so that every line of it fits on the page. The arithmetic does not change with the size: one token, one pass, whether there are sixty of them or sixty thousand.',
} as const;
