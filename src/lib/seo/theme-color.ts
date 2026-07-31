/**
 * The one colour that has to escape the CSS cascade.
 *
 * `<meta name="theme-color">` tints the browser chrome on Android and in
 * installed PWAs, and it takes a literal colour — there is no way to point it
 * at a custom property. That collides with CLAUDE.md hard rule 1, which allows
 * exactly one file in the repository to declare a colour value.
 *
 * Rather than break the rule with a hardcoded hex and a comment apologising for
 * it, the token source is imported as text and the value read out of it at
 * build time. `?raw` gives Vite's string form of the file, not a stylesheet, so
 * nothing extra is added to the CSS bundle. Change `--color-paper` and the
 * browser chrome follows on the next build, which is the behaviour anyone would
 * assume they were getting.
 */

import tokens from '../../styles/tokens.css?raw';
import { site } from '../../seo/site';

/**
 * Read a `--color-*` declaration out of a stylesheet's text.
 *
 * Exported for unit testing. Comments are stripped first because `tokens.css`
 * discusses its own token names in prose, and a sentence mentioning
 * `--color-paper` should not be mistaken for a declaration of it.
 */
export function resolveColorToken(css: string, token: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = new RegExp(`${token}\\s*:\\s*([^;]+);`);
  const match = pattern.exec(withoutComments);

  if (!match?.[1]) {
    throw new Error(
      `src/styles/tokens.css declares no ${token}. It is the source for <meta name="theme-color">; see src/lib/seo/theme-color.ts.`,
    );
  }

  return match[1].trim();
}

/** The resolved value of the token named in `site.themeColorToken`. */
export const themeColor = resolveColorToken(tokens, site.themeColorToken);
