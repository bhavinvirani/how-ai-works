/**
 * Words and numbers-as-words for ThresholdMatrix. See the header of
 * `../SpamRuleWriter/data.en.ts` for why an instrument that carries its own
 * teaching text keeps that text here rather than in `src/copy/en.ts` or in
 * required props.
 */
import type { Verdict } from './logic';

/**
 * Thousands separators without `toLocaleString`, whose output depends on the
 * runtime's locale data. An instrument has to render the same on every machine.
 */
export const formatCount = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Percentages to one decimal, so 99.0 and 99.1 are visibly different. */
export const formatPercent = (fraction: number): string =>
  (fraction * 100).toFixed(1);

/**
 * What each setting has produced, in words.
 *
 * These sentences are the second cue that keeps the tinted boxes from being the
 * only thing carrying meaning (hard rule 9), and they are what a screen reader
 * gets when the four numbers change silently underneath it.
 */
export const VERDICTS: Record<Verdict, string> = {
  findsNobody:
    'This is the detector that says "clear" to everybody who walks in. It scores better than most settings on this dial, and it has never helped anyone.',
  findsSome:
    'Better — and watch the accuracy while it improves. Every extra person called back counts against the score exactly as heavily as every illness found counts for it.',
  findsEveryone:
    'Nobody ill goes home now, and the accuracy is the worst it has been. Whether that trade is worth making depends on what a missed illness costs against a frightening fortnight, and nothing on this screen can tell you.',
  callsBackEveryone:
    'It now calls back every single person who walked in, which is the same as having no test at all. The opposite uselessness, and the score has collapsed to match.',
};

export const TEXT = {
  setup: (screened: number, ill: number) =>
    `One month of screening: ${formatCount(screened)} people, ${formatCount(ill)} of them genuinely ill. Nobody knows which ones until afterwards.`,

  eagernessLabel: 'How eager the test is to raise the alarm',
  eagernessDescription:
    'The test scores every scan for how suspicious it looks. This sets how high that score has to reach before anyone is called back — at the far left, nothing clears the bar.',

  tableCaption:
    'Everyone screened this month, sorted by what the test said and what turned out to be true.',
  answerColumn: 'What the test said',
  actuallyIll: 'Actually ill',
  actuallyHealthy: 'Actually healthy',
  saysAlarm: 'Test raises the alarm',
  saysQuiet: 'Test stays quiet',

  caught: 'caught',
  falseAlarms: 'false alarms',
  missed: 'missed',
  cleared: 'correctly cleared',

  /** Spelled out in every box, so the tint is never the only signal. */
  right: 'right',
  mistake: 'mistake',

  /** Written as functions so whole sentences live here, not at the call site. */
  accuracySentence: (percent: string) => `Accuracy: ${percent} per cent.`,

  foundSentence: (caught: number, ill: number) =>
    caught === 0
      ? `It has found none of the ${formatCount(ill)} ill people.`
      : `It found ${formatCount(caught)} of the ${formatCount(ill)} ill people.`,

  calledBack: (alarms: number, caught: number) =>
    `Of the ${formatCount(alarms)} people it called back, ${formatCount(caught)} really ${caught === 1 ? 'was' : 'were'} ill.`,

  noAlarms:
    'It never raised the alarm, so there was nothing to be right about.',

  baseline: (percent: string) =>
    `For comparison: saying "clear" to everybody scores ${percent} per cent on this month.`,

  bestOnTheDial: (percent: string, caught: number, ill: number) =>
    `The highest accuracy anywhere on this dial is ${percent} per cent, and that setting finds ${formatCount(caught)} of the ${formatCount(ill)}. Every setting was tried.`,
} as const;
