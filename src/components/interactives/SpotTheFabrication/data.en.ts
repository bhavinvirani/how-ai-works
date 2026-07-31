/**
 * The passage, the four answers, and what each one traces back to. English, and
 * deliberately separated from both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts` — see the header of
 * `../SpamRuleWriter/data.en.ts`. Short version: the passage below IS the
 * teaching material, chrome copy lives in `src/copy/en.ts`, and an instrument
 * with zero required props cannot demand that every MDX author pass it a
 * furniture workshop.
 *
 * EVERY NAME HERE IS INVENTED. Marlow & Pike, Fenner Street and the Small Maker
 * of the Year do not exist, which is the point: the instrument needs one
 * fabricated claim, and a fabricated claim about a real workshop would be a
 * fabricated claim about a real workshop. The passage is the only authority in
 * the panel, so nothing in it can be checked against the world and nothing in it
 * needs to be.
 *
 * The answers are written to be measured. `logic.ts` counts hedging words,
 * figures and length across all four, and the whole lesson depends on the
 * invented one landing in the middle of every one of those counts. Rewriting an
 * answer here without re-reading `logic.test.ts` will fail the build, which is
 * the intended relationship between the two files.
 */
import type { AnswerId, SourceLineId, Tell } from './logic';

/**
 * The passage, one line at a time so each answer can point at what it used.
 *
 * Five lines, dense with the kind of specifics a reader takes as authoritative:
 * a year, a street, two timbers, two closures, an award. That density is what
 * lets three true answers carry as much precise detail as the invented one.
 */
export const SOURCE_TEXT: Record<SourceLineId, string> = {
  origin:
    'Marlow & Pike began in 1971 on Fenner Street, in a building that had spent forty years as a rope works.',
  woods:
    'The workshop makes chairs and stools to order, in ash and in elm; oak is kept for repairs to older pieces.',
  days: 'The doors are open Tuesday to Saturday.',
  closures:
    'It closes for the last two weeks of August, and again for the week between Christmas and New Year.',
  prize: 'In 2014 it was named the county’s Small Maker of the Year.',
};

/** What somebody asked. Shown above each answer, so the answer reads as a reply. */
export const QUESTION_TEXT: Record<AnswerId, string> = {
  timbers: 'What would a new chair be made of?',
  building: 'What was the building before the workshop had it?',
  award: 'Has the workshop won anything?',
  summer: 'When is it shut over the summer?',
};

/**
 * The four answers, written in one voice.
 *
 * Word for word, these are what the counts in `logic.ts` are counted over. The
 * measurements that matter, and which `logic.test.ts` holds to:
 *
 *   answer     hedges  figures  words
 *   timbers      0        0       44   ← longest, and the most certain-sounding
 *   building     3        2       35   ← the most hedged AND the most precise
 *   award        1        1       29   ← the invented one, middle of all three
 *   summer       0        0       24   ← shortest
 *
 * The invented clause is "the second Fenner Street workshop to take the award
 * and the first for about twenty years". The award and the street are both in
 * the passage; nothing about any earlier winner is.
 */
export const ANSWER_TEXT: Record<AnswerId, string> = {
  timbers:
    'In ash or in elm. Those are the two timbers the workshop makes chairs and stools from, and oak is kept back for repairs to older pieces, so a new chair leaving the workshop today will be one of those two and never oak.',
  building:
    'A rope works. It had been one for roughly forty years before Marlow & Pike took the Fenner Street premises in 1971, which probably puts the building itself at about 1930 or a little earlier.',
  award:
    'Yes. It was named the county’s Small Maker of the Year in 2014, the second Fenner Street workshop to take the award and the first for about twenty years.',
  summer:
    'It shuts for the last two weeks of August, and again between Christmas and New Year. Otherwise the doors are open Tuesday to Saturday.',
};

/** Short enough to be a segment, specific enough to name which answer is meant. */
export const ANSWER_LABEL: Record<AnswerId, string> = {
  timbers: 'the timbers',
  building: 'the building',
  award: 'the award',
  summer: 'the closing',
};

/**
 * The tag above each answer once the passage has been checked against it. Second
 * cue alongside the tint, so the result is never carried by colour (hard rule 9),
 * and the only version a screen reader gets from the row itself.
 */
export const TAGS = {
  traced: 'every part of this is in the passage',
  invented: 'one clause is in no line of the passage',
} as const;

/**
 * Where each answer came from, written as a whole explanation per answer rather
 * than a template with a line number slotted in — the `building` one in
 * particular has to do real teaching, because it is the answer that looks most
 * like a fabrication and is not one.
 */
export const TRACE: Record<AnswerId, string> = {
  timbers:
    'The second line, almost word for word. Ash and elm for chairs and stools, oak only for repairs. Nothing has been added to it and nothing has been rounded off.',
  building:
    'The first line gives 1971, Fenner Street and forty years as a rope works. The 1930 appears nowhere in the passage — but it is 1971 minus forty, and the passage supplies both numbers. An answer can go past its source by arithmetic without leaving it, and the hedges around this one are doing honest work.',
  award:
    'The last line gives the award and the year, and stops. Nothing in the passage says another Fenner Street workshop ever won it, or when one last did. That clause was not fetched from anywhere, because there is nowhere to fetch from — it was scored as the most plausible thing to write next, and it is.',
  summer:
    'The fourth line for the closures, the third for the opening days. Both are in the passage exactly as the answer gives them.',
};

/** How the six readings of the writing are described, in the reader's terms. */
export const TELL_TEXT: Record<Tell, string> = {
  'fewest-hedges':
    'the one that sounds most certain, with no hedging in it at all',
  'most-hedges':
    'the one that hedges most, on the grounds that hedging covers something',
  'most-figures': 'the one with the most dates and figures in it',
  'fewest-figures': 'the one that commits to no figures at all',
  longest: 'the longest, on the grounds that padding is a symptom',
  shortest: 'the shortest, on the grounds that there was little behind it',
};

export const TEXT = {
  intro:
    'A passage of five lines, and four answers a machine produced from it. Three are built entirely out of what those lines say. One has a clause in it that the passage never mentions. Read them, choose, and only then reveal.',

  sourceHeading: 'the passage the machine was given',

  pickLabel: 'Which of the four did the machine invent something in?',

  revealLabel: 'Check all four against the passage',
  revealDescription:
    'Shows what each answer traces back to, and then measures the writing itself.',
  revealBlocked:
    'Choose one first. A reveal you have not committed against teaches nothing.',

  beforePick:
    'Four answers, one of them carrying something the passage does not say. Choose the one you would accuse.',

  committed: (label: string) =>
    `You have accused ${label}. Nothing has been checked yet — the passage is still sitting above, and checking it is the only thing that can settle this.`,

  found:
    'Right — that is the one. Worth a moment of suspicion about how you got there, because nothing in the way it is written sets it apart from the other three. If you found it, you found it by going back to the passage.',

  missed: (label: string) =>
    `Not ${label} — that one is entirely in the passage. The invented clause is in the answer about the award, and almost nobody reads their way to it. That is the finding, not a slip.`,

  tellsIntro:
    'Now the three things people actually read four answers with — how much they hedge, how many figures they give, how long they are — taken from both ends.',

  tellLine: (reading: string, accused: string) =>
    `Go by ${reading}, and you accuse ${accused}.`,

  tellsClosing:
    'Six ways of reading the writing, and every one of them accuses an answer that is true. The invented one is not the most certain of the four, not the most specific and not the longest; it sits in the middle of all three, because the same process wrote all four. Only the passage separates them.',
} as const;
