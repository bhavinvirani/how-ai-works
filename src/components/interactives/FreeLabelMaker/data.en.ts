/**
 * The three sentences, and the words around them. English, and deliberately
 * separated from both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts` — see the header of
 * `../SpamRuleWriter/data.en.ts`. Short version: the sentences below ARE the
 * teaching material, chrome copy lives in `src/copy/en.ts`, and an instrument
 * with zero required props cannot demand that every MDX author hand it a
 * novel, a text message and an encyclopaedia.
 *
 * Every sentence here is something a person wrote for an ordinary reason. That
 * is not decoration — the unit's claim is that text nobody prepared is already
 * full of marked answers, and a corpus of specially written examples would
 * quietly concede the argument.
 */
import type { Passage, Skill, SourceId } from './logic';

export const SOURCE_LABELS: Record<SourceId, string> = {
  novel: 'A novel',
  message: 'A text message',
  reference: 'An encyclopaedia',
};

/** Said under the chooser, to keep "nobody wrote this for a machine" in view. */
export const SOURCE_NOTES: Record<SourceId, string> = {
  novel: 'Written to move a scene along. Nobody marked it up for anything.',
  message: 'Sent to one person, once, about the weather.',
  reference: 'Written so that somebody could look up what happened, and when.',
};

/**
 * Grammar decoys are forms the sentence cannot take, so its shape alone
 * settles them. Every other kind of decoy is grammatically perfect and wrong
 * about the world — which is exactly the difficulty a machine has to grow into.
 */
const NOVEL: Passage = {
  words: [
    { text: 'She', needs: 'grammar', decoys: ['Her', 'Hers', 'Herself'] },
    { text: 'put', needs: 'grammar', decoys: ['putting', 'putted', 'to put'] },
    { text: 'the', needs: 'grammar', decoys: ['an', 'them', 'whose'] },
    { text: 'milk', needs: 'world', decoys: ['gravel', 'laughter', 'postage'] },
    {
      text: 'back',
      needs: 'grammar',
      decoys: ['backing', 'aback', 'backness'],
    },
    { text: 'in', needs: 'world', decoys: ['under', 'behind', 'beside'] },
    { text: 'the', needs: 'grammar', decoys: ['an', 'them', 'whose'] },
    {
      text: 'fridge',
      trailing: '.',
      needs: 'world',
      decoys: ['oven', 'wardrobe', 'letterbox'],
    },
  ],
};

const MESSAGE: Passage = {
  words: [
    { text: 'The', needs: 'grammar', decoys: ['An', 'Them', 'Whose'] },
    {
      text: 'pavement',
      needs: 'world',
      decoys: ['ceiling', 'kettle', 'argument'],
    },
    { text: 'is', needs: 'grammar', decoys: ['are', 'be', 'being'] },
    {
      text: 'still',
      needs: 'grammar',
      decoys: ['stiller', 'stillness', 'stilly'],
    },
    {
      text: 'wet',
      trailing: ',',
      needs: 'cause',
      decoys: ['dry', 'expensive', 'imaginary'],
    },
    { text: 'so', needs: 'grammar', decoys: ['such', 'very', 'too'] },
    { text: 'it', needs: 'grammar', decoys: ['its', 'them', 'theirs'] },
    {
      text: 'rained',
      needs: 'cause',
      decoys: ['dried', 'applauded', 'apologised'],
    },
    { text: 'last', needs: 'grammar', decoys: ['latest', 'lastly', 'leastly'] },
    {
      text: 'night',
      trailing: '.',
      needs: 'cause',
      decoys: ['century', 'summer', 'decade'],
    },
  ],
};

const REFERENCE: Passage = {
  words: [
    { text: 'The', needs: 'grammar', decoys: ['An', 'Them', 'Whose'] },
    { text: 'first', needs: 'fact', decoys: ['last', 'third', 'hundredth'] },
    {
      text: 'people',
      needs: 'world',
      decoys: ['penguins', 'envelopes', 'opinions'],
    },
    { text: 'walked', needs: 'world', decoys: ['swam', 'cycled', 'queued'] },
    { text: 'on', needs: 'world', decoys: ['inside', 'through', 'beneath'] },
    { text: 'the', needs: 'grammar', decoys: ['an', 'them', 'whose'] },
    { text: 'moon', needs: 'fact', decoys: ['seabed', 'motorway', 'rooftop'] },
    { text: 'in', needs: 'grammar', decoys: ['at', 'of', 'upon'] },
    {
      text: 'nineteen',
      needs: 'fact',
      decoys: ['eighteen', 'seventeen', 'thirteen'],
    },
    {
      text: 'sixty-nine',
      trailing: '.',
      needs: 'fact',
      decoys: ['twelve', 'forty-two', 'ninety-nine'],
    },
  ],
};

export const PASSAGES: Record<SourceId, Passage> = {
  novel: NOVEL,
  message: MESSAGE,
  reference: REFERENCE,
};

/**
 * Said only after a guess. Showing it beforehand would hand over the answer —
 * "you will need to know how kitchens work" is most of the way to "fridge".
 */
export const SKILL_NOTES: Record<Skill, string> = {
  grammar:
    'Grammar alone settled that one. Only one shape of word fits the gap, and you never had to know anything about the world to see it.',
  world:
    'That one needed to know how the world is arranged — what is kept where, and what goes with what. The sentence says none of it.',
  cause:
    'That one needed cause and effect, run backwards. You never see the event, only the mark it left behind.',
  fact: 'That one was a plain fact. Nobody wrote it down as a fact — it is simply the word that kept turning up in that position.',
};

export const TEXT = {
  sourceLabel: 'Where this sentence came from',
  positionLabel: 'Position of the hidden word',
  guessLabel: 'What was under the blank?',

  /** Read in place of the gap, so the sentence still says something aloud. */
  spokenBlank: 'blank',

  positionValue: (position: number, total: number) =>
    `${String(position)} of ${String(total)}`,

  prompt: (sentence: string) =>
    `${sentence} Choose which word you think was covered up.`,

  correct: (answer: string) => `Right. The text said “${answer}”.`,

  wrong: (guess: string, answer: string) =>
    `You said “${guess}”. The text said “${answer}”.`,

  restored:
    'The sentence is whole again, exactly as it was written. Nothing was added to it — the answer had never left.',

  supply: (count: number) =>
    `Nobody wrote an answer key for this sentence. Covering one word at a time turns it into ${String(count)} questions, and the answer to every one of them was already sitting in the text.`,
} as const;
