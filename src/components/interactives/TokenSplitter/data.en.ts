/**
 * Words for TokenSplitter. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 */

export type PresetId = 'english' | 'name' | 'number' | 'other';

export const PRESET_IDS: readonly PresetId[] = [
  'english',
  'name',
  'number',
  'other',
];

/**
 * Four short phrases, one per thing worth noticing.
 *
 * The first is the baseline: ordinary English, where the list mostly fits. The
 * other three are the three places it stops fitting — a surname nobody wrote a
 * list for, a run of digits, and six characters of a language the list was
 * never built from. All four are the same order of length, so the piece counts
 * can be compared without doing any arithmetic.
 */
export const PRESETS: Record<PresetId, { label: string; text: string }> = {
  english: { label: 'English', text: 'the letter was not for you' },
  name: { label: 'a name', text: 'a letter for Kowalczyk' },
  number: { label: 'a number', text: 'order 4417290385' },
  other: { label: 'not English', text: 'hello नमस्ते' },
};

/** Marks a space that belongs to the piece it sits in front of. */
export const SPACE_MARK = '␣';

/** Beyond this many pieces, reading them all aloud stops being a kindness. */
const SPOKEN_LIMIT = 16;

const count = (value: number, singular: string, plural: string): string =>
  `${String(value)} ${value === 1 ? singular : plural}`;

export const TEXT = {
  inputLabel: 'Text to cut up',
  inputDescription:
    'Type over it. A rare name, a long number, or a language that is not English are the three that misbehave.',

  presetLabel: 'Or start from one of these',

  empty: 'Nothing to cut up yet.',

  /**
   * The three numbers, in the order they stop being obvious. Characters are
   * what you can see, words are what you think you are paying for, and pieces
   * are what you are actually paying for.
   */
  counts: (characters: number, words: number, pieces: number) =>
    `${count(characters, 'character', 'characters')}, ${count(
      words,
      'word',
      'words',
    )} — and ${count(pieces, 'piece', 'pieces')}.`,

  perPiece: (value: number) =>
    `That works out at ${value.toFixed(1)} characters to a piece.`,

  /**
   * The cost of being a language the list was not built from, said as
   * arithmetic rather than as a complaint.
   */
  unlisted: (characters: number, pieces: number) =>
    `${count(characters, 'character', 'characters')} here never made it into the list at any size, so each one arrives as the raw numbers a computer stores it as: ${count(pieces, 'piece', 'pieces')} between them, and not one of them is a letter.`,

  spoken: (labels: readonly string[]) =>
    labels.length > SPOKEN_LIMIT
      ? ''
      : `The pieces, in order: ${labels.join(' / ')}.`,

  /**
   * The honest correction, and it has to be here rather than in the unit: a
   * reader who types their own sentence will see ordinary words come apart in
   * a way a real tokenizer would not, and should know why before they draw a
   * conclusion from it.
   */
  listNote: (merges: number) =>
    `Everything above is cut with one small list, built by glueing the commonest pair of pieces together ${String(merges)} times. A real one runs that same loop about a hundred thousand times, so it holds whole ordinary words where this one still holds fragments. What you are watching is the right shape at the wrong size — and the size it is wrong by is generous to English.`,
} as const;
