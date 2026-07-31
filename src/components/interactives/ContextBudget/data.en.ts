/**
 * Words for ContextBudget. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 *
 * `ITEM_TEXT` is a `Record<ItemId, string>`, so adding a message to a preset in
 * `logic.ts` without writing a line for it here fails to compile. That is
 * deliberate: a window full of unlabelled blocks is a chart, and this is
 * supposed to be a conversation.
 */
import type { ItemId, ItemState, PresetId, Strategy } from './logic';

const groupDigits = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const tokens = (value: number): string =>
  `${groupDigits(value)} ${value === 1 ? 'token' : 'tokens'}`;

const count = (value: number, singular: string, plural: string): string =>
  `${String(value)} ${value === 1 ? singular : plural}`;

/**
 * One line per thing in the window, in the voice of whoever put it there.
 *
 * Deliberately gists rather than full messages. The reader is meant to be
 * watching the sizes and what survives, and nine paragraphs of invented travel
 * chat would bury both.
 */
export const ITEM_TEXT: Record<ItemId, string> = {
  'chat-brief':
    'you — four days in Lisbon in October, two of us, under £900 all in',
  'chat-plan': 'it — a first sketch of the four days',
  'chat-hills': 'you — neither of us can manage steep hills',
  'chat-replan': 'it — the same four days, rerouted to stay flat',
  'chat-day-two': 'you — what is worth doing on the second day?',
  'chat-day-two-answer': 'it — the second day, in detail',
  'chat-booking': 'you — the flight confirmation email, pasted in whole',
  'chat-booking-answer': 'it — what those flight times change about the plan',
  'chat-afford': 'you — so can we still afford the boat trip?',

  'rag-earlier-question': 'you — what the customer asked two messages ago',
  'rag-earlier-answer': 'it — the answer it gave then',
  'rag-question': 'you — the question being answered right now',
  'rag-returns': 'fetched — the returns policy, the page that answers it',
  'rag-shipping':
    'fetched — the shipping policy, pulled in because it reads alike',
  'rag-old-returns': 'fetched — last year’s returns policy, withdrawn in March',
  'rag-warranty': 'fetched — the warranty terms, related but not to this',
  'rag-thread': 'fetched — a support thread using all the same words',
};

/** Where each thing ended up, said in words rather than by position or colour. */
export const STATE_TEXT: Record<ItemState, string> = {
  kept: 'in the window',
  pinned: 'in the window, and cannot be dropped',
  dropped: 'fell out',
  summarised: 'inside the summary',
};

export const STRATEGY_TEXT: Record<
  Strategy,
  { label: string; description: string }
> = {
  oldest: {
    label: 'the oldest first',
    description:
      'What almost everything does when nobody has decided otherwise. It is cheap, it needs no judgement, and it always throws away the beginning — which is where people put the things that have to hold for the whole conversation.',
  },
  biggest: {
    label: 'the biggest first',
    description:
      'Frees the most room per message thrown away, so far more of the conversation survives. What goes instead is whatever was substantial — the pasted document, the long answer — which is usually the thing everything since has been about.',
  },
  summarise: {
    label: 'summarise the oldest',
    description:
      'Replaces the oldest stretch with one short stand-in, so a trace of the beginning survives. The stand-in costs an eighth of what it replaces, and keeps whatever the summariser thought mattered. Nobody asked you which parts those were.',
  },
};

/**
 * Per-board wording. The two presets are the same arithmetic and a completely
 * different story, and the sentence that names what was just lost has to be
 * about the story or it teaches nothing.
 */
export const PRESET_TEXT: Record<
  PresetId,
  {
    stageLabel: string;
    stageValue: (stage: number) => string;
    keyFactSafe: string;
    keyFactDropped: string;
    keyFactSummarised: string;
  }
> = {
  chat: {
    stageLabel: 'Turns of the conversation so far',
    stageValue: (stage) => count(stage, 'turn', 'turns'),
    keyFactSafe:
      'The £900 is still in there, so it can still tell you whether the boat trip fits.',
    keyFactDropped:
      'The £900 has left the window. Ask it now whether the boat trip is affordable and it will answer anyway, confidently, out of nothing — and nothing in there will suggest a number is missing.',
    keyFactSummarised:
      'The £900 is now only whatever the summary kept of it, which might be the figure, or might be “they mentioned a budget”.',
  },
  retrieval: {
    stageLabel: 'How much has been loaded in',
    stageValue: (stage) => count(stage, 'piece', 'pieces'),
    keyFactSafe:
      'The returns policy — the one page that answers the question — is still in the window.',
    keyFactDropped:
      'The returns policy is gone. What is left is four pages that use the same words and answer something else, which is worse than an empty window rather than better.',
    keyFactSummarised:
      'The returns policy now survives only inside the summary, at an eighth of its length. Whether the clause that matters made it in is not something anybody checked.',
  },
};

export const TEXT = {
  /** Small mono labels inside the drawing, which is otherwise aria-hidden. */
  windowLabel: (capacity: number) => `the window — ${tokens(capacity)}`,
  droppedLabel: 'no longer in it',

  strategyLabel: 'When it will not fit, throw out',

  /** The exact split, for a reader who wants to check the drawing. */
  tally: (
    instructions: number,
    conversation: number,
    reply: number,
    spare: number,
  ) =>
    `${groupDigits(instructions)} instructions · ${groupDigits(conversation)} conversation · ${groupDigits(reply)} held for the reply · ${groupDigits(spare)} spare`,

  inUse: (used: number, capacity: number) =>
    `${groupDigits(used)} of the window’s ${groupDigits(capacity)} tokens are spoken for.`,

  roomLeft: (spare: number) =>
    `Nothing has had to go yet — everything said so far is still in there, with ${tokens(spare)} to spare.`,

  droppedSome: (dropped: number, kept: number) =>
    `${count(dropped, 'piece', 'pieces')} would not fit and ${dropped === 1 ? 'is' : 'are'} no longer in the window. ${count(kept, 'piece', 'pieces')} ${kept === 1 ? 'is' : 'are'} left.`,

  summaryLine: (summaryTokens: number, replaced: number, pieces: number) =>
    `${count(pieces, 'piece', 'pieces')} — ${tokens(replaced)} of them — have been replaced by a ${groupDigits(summaryTokens)}-token summary.`,

  /**
   * The unit's whole argument in one sentence, and the only line here that does
   * not describe the picture: it describes the picture's history.
   */
  reread: (read: number, typed: number) =>
    `Getting this far has made it read ${tokens(read)}. You have typed ${groupDigits(typed)}.`,

  /** One row of the list under the drawing. */
  rowMeta: (itemTokens: number, state: string) =>
    `${groupDigits(itemTokens)} · ${state}`,

  summaryRow: (pieces: number) =>
    `a stand-in summary of the ${count(pieces, 'piece', 'pieces')} above`,

  listLabel: 'Everything in play, oldest first',

  /**
   * The honest correction, and it belongs here rather than in the unit: a
   * reader who notices that a thousand tokens is absurdly small should find the
   * answer next to the thing that surprised them.
   */
  scaleNote:
    'A thousand tokens is about a page and a half. Real windows are hundreds of times bigger — and they fill up, for exactly the reasons drawn here: one pasted document, one long transcript, one day of back-and-forth. A bigger window moves the moment. It does not remove it.',
} as const;
