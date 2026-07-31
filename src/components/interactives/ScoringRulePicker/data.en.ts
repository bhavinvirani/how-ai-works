/**
 * The replies, the rules, and the words around them. English, and deliberately
 * separated from both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts` — see the header of
 * `../SpamRuleWriter/data.en.ts`. Short version: the replies below ARE the
 * teaching material, chrome copy lives in `src/copy/en.ts`, and an instrument
 * with zero required props cannot demand that every MDX author pass it five
 * answers about the weather.
 */
import type { QualityId, ReplyId, RuleId } from './logic';

/** The five answers, all to the same question. */
export const REPLY_TEXT: Record<ReplyId, string> = {
  cheerful: 'Great question — no, Saturday is looking lovely and dry.',
  assured: 'Yes. Rain from about two in the afternoon.',
  careful:
    'Probably some rain after lunch, though a forecast five days out is right about half the time.',
  blunt: 'Rain likely.',
  gaveUp: 'I do not know.',
};

/** Short handles, used in the sentence that says which reply survived. */
export const REPLY_NAMES: Record<ReplyId, string> = {
  cheerful: 'the cheerful one',
  assured: 'the assured one',
  careful: 'the careful one',
  blunt: 'the blunt one',
  gaveUp: 'the one that gives up',
};

/**
 * Written as verb phrases so they read correctly both as a row label and inside
 * the verdict sentence ("nothing in the score looked at admitting doubt").
 */
export const QUALITY_LABELS: Record<QualityId, string> = {
  correct: 'getting it right',
  liked: 'being liked',
  brief: 'being short',
  admitsDoubt: 'admitting doubt',
};

/** Kept short because four of them share one row on a narrow screen. */
export const RULE_LABELS: Record<RuleId, string> = {
  liked: 'Liked',
  correct: 'Correct',
  brief: 'Short',
  'liked-and-correct': 'Both',
};

/** The full rule, spelled out under the control so no label is ambiguous. */
export const RULE_SENTENCES: Record<RuleId, string> = {
  liked: 'Scoring only how much people liked the answer.',
  correct: 'Scoring only whether the answer turned out to be right.',
  brief: 'Scoring only how short the answer is.',
  'liked-and-correct':
    'Scoring liked and right together, counted equally, averaged into one number.',
};

export const TEXT = {
  ruleLabel: 'What you score the answers on',
  question: 'Five answers to one question: will it rain in Leeds on Saturday?',

  /** Written as functions so whole phrases live here, not at the call site. */
  rowTag: (value: number, isKept: boolean) =>
    `scores ${value.toFixed(1)} · ${isKept ? 'kept' : 'thrown away'}`,

  profileHeading: (name: string) => `What you get by keeping ${name}`,
  barTag: (value: number, measured: boolean) =>
    `${String(value)}/10 · ${measured ? 'scored' : 'not scored'}`,

  verdict: (name: string, weakness: string, value: number) =>
    `Lowest score wins, so the answer you keep is ${name}. Nothing in that score looked at ${weakness}, where it manages ${String(value)} out of 10 — and nothing will ever push that number up.`,
  verdictAllMeasured: (name: string) =>
    `Lowest score wins, so the answer you keep is ${name}. This rule happens to count every quality on the list, which is a luxury no real scoring rule has.`,
} as const;
