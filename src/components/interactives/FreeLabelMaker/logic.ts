/**
 * Pure logic for FreeLabelMaker (§3.3).
 *
 * The instrument teaches one thing: every word of ordinary text is already a
 * question with its answer attached. Nothing is added to a sentence to make a
 * training example out of it — a word is covered up, and the word that was
 * covered up IS the answer.
 *
 * That claim is structural rather than asserted, which is why `blankedText`
 * takes the filler as an argument. Put the filler back and you get the author's
 * sentence, character for character, because the answer never left the data.
 * `logic.test.ts` runs that round trip over every word of every passage, so a
 * dataset edit that quietly invents an answer fails the build.
 *
 * Nothing here is random. The four options a reader chooses between are the
 * word plus three authored decoys, and the true word's place in the row is
 * decided by its position in the sentence — so the instrument behaves
 * identically on every visit (§3.3).
 */

/**
 * What you have to know to put a covered word back.
 *
 * This is the second half of the lesson. Some blanks are settled by the shape
 * of the sentence alone; others cannot be filled without knowing something the
 * sentence never says. Both cost the same to produce, which is why a machine
 * playing this game ends up learning far more than spelling.
 */
export type Skill = 'grammar' | 'world' | 'cause' | 'fact';

/** Which piece of ordinary writing is on screen. */
export type SourceId = 'novel' | 'message' | 'reference';

/** Fixed display order for the chooser. */
export const SOURCES: readonly SourceId[] = ['novel', 'message', 'reference'];

export interface Word {
  /** The word itself, with no punctuation attached. */
  text: string;
  /**
   * Punctuation that belongs after the word and stays visible while the word
   * is hidden. A blank that swallows the full stop changes the shape of the
   * sentence, which would hand the reader a clue the machine never gets.
   */
  trailing?: string;
  needs: Skill;
  /**
   * Three wrong answers, offered alongside the real one. Authored rather than
   * generated: for a `grammar` word they are forms the sentence cannot take,
   * and for every other word they fit the grammar perfectly and are wrong
   * about the world. That contrast is the whole point of the `needs` field.
   */
  decoys: readonly [string, string, string];
}

export interface Passage {
  words: readonly Word[];
}

/** How many words there are — and therefore how many questions. */
export const wordCount = (passage: Passage): number => passage.words.length;

export function wordAt(passage: Passage, index: number): Word {
  const word = index < 0 ? undefined : passage.words.at(index);

  if (!word) {
    throw new RangeError(`No word at position ${String(index)}`);
  }

  return word;
}

export const answerAt = (passage: Passage, index: number): string =>
  wordAt(passage, index).text;

export const skillAt = (passage: Passage, index: number): Skill =>
  wordAt(passage, index).needs;

/**
 * Keeps the chosen position inside the passage. One-based, because that is the
 * number on the control the reader is holding — switching to a shorter passage
 * must not leave the blank pointing past the end of it.
 */
export function clampPosition(passage: Passage, position: number): number {
  const count = wordCount(passage);
  if (count === 0) return 1;

  return Math.min(Math.max(Math.round(position), 1), count);
}

/** The sentence exactly as its author wrote it. */
export const plainText = (passage: Passage): string =>
  passage.words.map((word) => `${word.text}${word.trailing ?? ''}`).join(' ');

/** The same sentence with one word covered by `filler`. */
export const blankedText = (
  passage: Passage,
  hiddenIndex: number,
  filler: string,
): string =>
  passage.words
    .map(
      (word, index) =>
        `${index === hiddenIndex ? filler : word.text}${word.trailing ?? ''}`,
    )
    .join(' ');

/** The true word plus its three decoys. */
export const OPTION_COUNT = 4;

export function optionsFor(passage: Passage, index: number): string[] {
  const word = wordAt(passage, index);
  const options = [...word.decoys];

  // Deterministic, and not always in the same place: the true word takes the
  // slot its own position in the sentence gives it. An instrument that always
  // put the answer first would be teaching the reader to press "first".
  options.splice(index % OPTION_COUNT, 0, word.text);

  return options;
}

export const isCorrect = (
  passage: Passage,
  index: number,
  guess: string,
): boolean => guess === answerAt(passage, index);

/** Every word is one question, so this is just the length said out loud. */
export const freeQuestions = (passage: Passage): number => wordCount(passage);

export const totalFreeQuestions = (passages: readonly Passage[]): number =>
  passages.reduce((running, passage) => running + freeQuestions(passage), 0);

/** Which kinds of knowing this passage demands, with duplicates removed. */
export const skillsIn = (passage: Passage): Skill[] => [
  ...new Set(passage.words.map((word) => word.needs)),
];
