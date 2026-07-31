import { persistentAtom } from '@nanostores/persistent';

/**
 * Languages a developer aside can show, in the order their tabs appear.
 *
 * Java first and Python second is deliberate (§3.5): the existing material is
 * Java, and Python is the priority second. Adding a language is a line here
 * plus a `<Fragment slot="...">` in the aside — no aside is ever *required* to
 * provide every language, so translations never block a unit from shipping.
 */
export const LANGUAGES = [
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]['id'];

/**
 * The reader's preferred language, remembered across the whole site.
 *
 * Someone who picks Python once should not have to pick it again in every
 * aside they meet. Persisted rather than held in memory so it survives a
 * reload too.
 */
export const preferredLanguage = persistentAtom<string>(
  'how-ai-works:language',
  LANGUAGES[0].id,
);
