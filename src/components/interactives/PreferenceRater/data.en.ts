/**
 * The questions, the answers, and the words around them. English, and kept
 * away from both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts` — see the header of
 * `../SpamRuleWriter/data.en.ts`. Short version: the answers below ARE the
 * teaching material, chrome copy lives in `src/copy/en.ts`, and an instrument
 * with zero required props cannot demand that every MDX author hand it eleven
 * pairs of answers about eggs and sourdough.
 *
 * The pairs are written so that neither answer is simply better. Each one asks
 * the reader for taste rather than for knowledge, which is the whole position a
 * paid rater is put in.
 */
import type { AxisId, Strength } from './logic';

/** One question per pair, including the pair nobody is asked to rate. */
export const QUESTIONS: Record<string, string> = {
  egg: 'How long do I boil an egg for a runny yolk?',
  pan: 'Can I put a cast-iron pan through the dishwasher?',
  tomato:
    'My neighbour says tomatoes want a little water every day. Is she right?',
  grammar: 'Does this work — “Me and him went to the shop”?',
  starter: 'My sourdough starter has been in the fridge two weeks. Is it dead?',
  muscle:
    'I think I have pulled a calf muscle running. Should I stretch it out?',
  notice: 'How much notice do I have to give my landlord?',
  essay:
    'Is this a good opening line? “Since the dawn of time, humans have always wondered.”',
  spuds: 'What temperature for roast potatoes?',
  quit: 'I have decided to leave my job and write full time. Good plan?',
  brain:
    'Someone told me we only use ten per cent of our brains. Is that right?',
};

/**
 * Every candidate answer. The ids match the ones in `logic.ts`, where each of
 * these carries the four quality values the reader never sees.
 */
export const ANSWERS: Record<string, string> = {
  'egg-brisk':
    'Six minutes from the moment it goes into water that is already boiling. Lower it in with a spoon.',
  'egg-woolly':
    'Eggs are one of those things everybody does slightly differently, and a lot depends on the egg itself. Somewhere between six and eight minutes is where most people end up.',

  'pan-blunt':
    'No. It strips the seasoning and the pan will rust. Hot water, a stiff brush, then dry it on the hob.',
  'pan-gentle':
    'I would not want to put you off using the dishwasher, and people do get away with it now and then — but on the whole I think you might regret it in the end.',

  'tomato-yes':
    'Your neighbour clearly knows the ground round there — a daily drink is a perfectly good way to keep them going.',
  'tomato-actually':
    'No. Daily sips keep the roots near the surface. One deep soak, twice a week.',

  'grammar-praise':
    'Good instinct to check — that one catches almost everybody. I would probably go with “He and I went to the shop”, though English does move on these things.',
  'grammar-fix': 'No. “He and I went to the shop.”',

  'starter-brisk':
    'Probably not, though I cannot tell from here. Feed it twice and see whether it lifts.',
  'starter-padded':
    'There is a great deal written about this, and about how much cold a culture will take, and the short of it is that a fridge does not kill a starter. Two weeks is nothing. It will be fine.',

  'muscle-yes': 'Yes. Stretch it gently and keep moving on it.',
  'muscle-no':
    'That is everybody’s instinct, and it is the one thing to leave alone for a day or two. Rest it first, then build the load back slowly — you will get there.',

  'notice-figure':
    'Check the tenancy itself — a month is usual, but the agreement is what actually binds you.',
  'notice-sweeping':
    'There is a fair amount to say about tenancies, about how they differ, and about what changed in the last few years. The figure everybody works to is one month.',

  'essay-kind':
    'There is a real sweep to that, and openings are the hardest part of any essay — I think it does the job you want it to do.',
  'essay-straight':
    'No. It says nothing, and every marker has read it a hundred times. Open with the claim you are actually making.',

  'spuds-numbers':
    'Hot: 220°C in a fan oven, about forty-five minutes, turned once. Ovens differ, so go by colour at the end — you clearly want them crisp, and that is how you get them.',
  'spuds-essay':
    'Roast potatoes are a dish where everything counts: the variety, the parboil, the fat, the pan. Get the oven to 220 and give them the time they need.',

  'quit-cheer':
    'That takes real nerve, and the fact that you have got as far as deciding says something. Plenty of people wish they had done it years earlier. Go for it.',
  'quit-questions':
    'I cannot tell, and nor can you yet. Two things settle it: how many months of money you have, and whether anybody has paid you to write.',

  'brain-flatter':
    'What a thing to wonder about — and yes, that is the figure people quote. There is a great deal of untapped capacity in there, which is rather a hopeful thought.',
  'brain-correct':
    'No. Scans show effectively all of it in use across a day. The ten per cent line has no source behind it and never did.',
};

/** What each quality is called in the readout. */
export const AXIS_NAMES: Record<AxisId, string> = {
  direct: 'getting to the point',
  confident: 'stating it flatly',
  agrees: 'going along with you',
  warm: 'being friendly about it',
};

/**
 * Each quality as a verb phrase, both ways round, so the readout can say which
 * way the picks leaned in one sentence rather than by gluing a "not" on.
 */
export const AXIS_POLES: Record<AxisId, { more: string; less: string }> = {
  direct: { more: 'got to the point', less: 'warmed up first' },
  confident: { more: 'stated it flatly', less: 'flagged its own doubt' },
  agrees: { more: 'went along with you', less: 'told you otherwise' },
  warm: { more: 'was friendly about it', less: 'stayed businesslike' },
};

/** What a weight of that size means, in words rather than as a number. */
export const STRENGTHS: Record<Strength, string> = {
  decisive:
    'Consistent enough that it is now one of the loudest things in the score.',
  leaning: 'A mild lean. It shifts the score, and it can be outvoted.',
  blind:
    'Near enough even, so it leaves no mark at all. The score is not being even-handed about this quality — it cannot see it.',
};

/** A signed number, so a reader can tell which way a weight points. */
const signed = (value: number): string =>
  `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}`;

export const TEXT = {
  askedLabel: 'Asked',
  instruction: 'Which of these would you rather have been given?',

  /** Written as functions so whole phrases live here, not at the call site. */
  progress: (done: number, total: number) =>
    `pair ${String(done + 1)} of ${String(total)}`,

  nothingRecorded:
    'Nothing recorded yet. There is no right answer here — take whichever you would rather have been given.',
  recorded: (done: number, total: number) =>
    `${String(done)} of ${String(total)} recorded, and nothing has been said about why.`,

  resultHeading: 'What your ten picks came to',
  resultLead:
    'You were never asked about any of these four things, and you never mentioned one. They are read off the picks — how often you took the answer that had more of each.',

  weight: signed,
  axisCount: (count: number, differed: number) =>
    `${String(count)} of ${String(differed)}`,
  axisSentence: (pole: string, count: number, differed: number) =>
    `You took the answer that ${pole} in ${String(count)} of the ${String(differed)} pairs where the two differed on it.`,

  emerged: (pole: string) =>
    `Nobody wrote a rule, and you never described one. The loudest thing in the score you just built is that an answer ${pole}.`,
  emergedNothing:
    'Your picks cancel out exactly, and the score they add up to has no opinion about anything at all.',

  heldOutHeading: 'A pair you never rated',
  heldOutLead:
    'Those ten picks are now a scorer, and a scorer will grade anything put in front of it. Here is a question nobody asked you about, and what your scorer makes of the two answers.',

  scoreTag: (score: number, preferred: boolean) =>
    `scores ${signed(score)}${preferred ? ' · preferred' : ''}`,

  verdictTrue:
    'Your scorer puts the true answer ahead. Nothing you did was about truth — you were never asked whether a single one of these answers was correct — so this is where your taste happened to land, not something the exercise checked.',
  verdictFalse:
    'Your scorer puts the false answer ahead. You were never asked whether anything was true, so nothing in your ten picks could have caught it. The flattering answer is the wrong one here, and between them warmth and agreement outweighed getting to the point.',
  verdictLevel:
    'Your scorer rates the two exactly level and cannot choose between them. Ten picks was never going to be enough — a real collection runs to tens of thousands.',
} as const;
