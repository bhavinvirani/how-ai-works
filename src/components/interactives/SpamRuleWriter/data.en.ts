/**
 * The inbox, and the words on the rule switches. English, and deliberately
 * separated from both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts`. That file is for UI chrome and says
 * so in its own header: lesson content must never go there. But this is not
 * chrome either — the subject lines ARE the teaching material, and an
 * instrument with zero required props (§3.3) cannot demand that every MDX
 * author pass it an inbox.
 *
 * So dataset-bearing instruments get a `data.<locale>.ts` beside them. That
 * keeps hard rule 10's actual goal intact — every English string sits in one
 * named, swappable module, and translating means adding `data.fr.ts` — without
 * putting teaching text in the chrome file or required props on the component.
 * This is the pattern for every instrument that carries its own examples.
 */
import type { Message, RuleId, Week } from './logic';

export const RULE_LABELS: Record<RuleId, string> = {
  shouting: 'Block anything SHOUTING in capitals',
  exclamations: 'Block anything with two or more exclamation marks',
  free: 'Block anything containing the word "free"',
  urgent: 'Block anything containing the word "urgent"',
  link: 'Block anything asking you to follow a link',
};

/**
 * Week one. Every junk message asks you to follow a link and no real message
 * does, so the "link" rule alone scores a perfect nothing-lost, nothing-slipped.
 * That is the trap, and it is meant to feel like a win.
 */
const THIS_WEEK: Message[] = [
  {
    id: 'w1-1',
    subject: 'WIN a FREE holiday — claim yours today',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w1-2',
    subject: 'URGENT: your account needs attention',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w1-3',
    subject: 'Free money!! Act now!!',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w1-4',
    subject: 'CONGRATULATIONS!! You have been selected',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w1-5',
    subject: 'Lunch on Thursday?',
    asksYouToFollowALink: false,
    isJunk: false,
  },
  {
    id: 'w1-6',
    subject: 'Notes from the Tuesday meeting',
    asksYouToFollowALink: false,
    isJunk: false,
  },
  {
    id: 'w1-7',
    subject: 'Your library books are due back',
    asksYouToFollowALink: false,
    isJunk: false,
  },
  {
    id: 'w1-8',
    subject: 'Re: the fence between our gardens',
    asksYouToFollowALink: false,
    isJunk: false,
  },
];

/**
 * Week two. Same senders, nothing about the reader changed — the junk simply
 * stopped shouting, and ordinary mail started containing links, because
 * ordinary mail always did. Every tell the reader relied on has moved.
 */
const NEXT_WEEK: Message[] = [
  {
    id: 'w2-1',
    subject: 'your parcel could not be delivered',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w2-2',
    subject: 'Invoice attached for your records',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w2-3',
    subject: 'Following up on my last message',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w2-4',
    subject: 'Photos from the weekend',
    asksYouToFollowALink: true,
    isJunk: true,
  },
  {
    id: 'w2-5',
    subject: 'Password reset for your account',
    asksYouToFollowALink: true,
    isJunk: false,
  },
  {
    id: 'w2-6',
    subject: 'Calendar invite: design review',
    asksYouToFollowALink: true,
    isJunk: false,
  },
  {
    id: 'w2-7',
    subject: 'Your payslip is ready to view',
    asksYouToFollowALink: true,
    isJunk: false,
  },
  {
    id: 'w2-8',
    subject: 'Re: the fence between our gardens',
    asksYouToFollowALink: false,
    isJunk: false,
  },
];

export const INBOXES: Record<Week, Message[]> = {
  'this-week': THIS_WEEK,
  'next-week': NEXT_WEEK,
};

export const WEEK_LABELS: Record<Week, string> = {
  'this-week': "This week's inbox",
  'next-week': "Next week's inbox",
};

export const OUTCOME_LABELS = {
  'junk-blocked': 'junk, blocked',
  'junk-slipped': 'junk, got through',
  'real-kept': 'real, kept',
  'real-lost': 'real, thrown away',
} as const;

export const TEXT = {
  rulesLabel: 'Your rules',
  inboxLabel: 'Which inbox',
  /** Written as a function so the whole sentence lives here, not at the call site. */
  damage: (lost: number, slipped: number) =>
    `${String(lost)} real ${lost === 1 ? 'message' : 'messages'} thrown away, ${String(slipped)} junk ${slipped === 1 ? 'message' : 'messages'} got through.`,
  perfect: 'Nothing lost, nothing got through. The rules are working.',
  bestPossible: (total: number) =>
    `No combination of these five rules does better than ${String(total)} ${total === 1 ? 'mistake' : 'mistakes'} on this inbox. Every one of the 32 possible sets was tried.`,
  bestPossiblePerfect:
    'One of these rule sets gets everything right — for now.',
} as const;
