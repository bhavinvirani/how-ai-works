/**
 * ESLint rule: forbid raw colour literals outside the design-token source.
 *
 * `src/styles/tokens.css` is the single source of truth for colour (CLAUDE.md
 * hard rule 1). Every component, diagram, and island must consume tokens —
 * either as Tailwind utilities generated from `@theme`, or as `var(--color-*)`.
 *
 * This rule covers the files ESLint parses (`.ts`, `.tsx`, `.astro`). Plain
 * `.css` and `.svg` files are outside ESLint's reach and are covered by
 * `scripts/check-raw-colors.mjs`, which runs in the same `pnpm lint` gate.
 *
 * It deliberately does NOT flag every `#`-prefixed string: `href="#checkpoint"`
 * is a fragment link, not a colour. A bare hex is reported only when the whole
 * string is a valid hex colour, or when it appears inside a CSS declaration or
 * a Tailwind arbitrary value.
 */

/** A string that is nothing but a hex colour: #rgb, #rgba, #rrggbb, #rrggbbaa. */
const WHOLE_HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Functional colour notations, e.g. `rgb(`, `hsla(`, `oklch(`. */
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\(/i;

/** A hex colour used as a CSS value, e.g. `color: #a81b5d` or `fill:#fff`. */
const HEX_IN_DECLARATION = /:\s*#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;

/** A hex colour inside a Tailwind arbitrary value, e.g. `bg-[#a81b5d]`. */
const HEX_IN_ARBITRARY_VALUE =
  /\[[^\]]*#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})[^\]]*\]/i;

/**
 * Decide whether a string value contains a raw colour.
 * Exported for unit testing.
 *
 * @param {unknown} value
 * @returns {string | null} the offending colour, or null when the value is clean
 */
export function findRawColor(value) {
  if (typeof value !== 'string' || value.length === 0) return null;

  const trimmed = value.trim();
  if (WHOLE_HEX.test(trimmed)) return trimmed;

  const fn = COLOR_FUNCTION.exec(value);
  if (fn) return fn[0].replace(/\s*\($/, '()');

  const declaration = HEX_IN_DECLARATION.exec(value);
  if (declaration) return declaration[0].split(':')[1].trim();

  const arbitrary = HEX_IN_ARBITRARY_VALUE.exec(value);
  if (arbitrary) return arbitrary[0];

  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw colour literals; use design tokens from src/styles/tokens.css',
    },
    schema: [],
    messages: {
      rawColor:
        'Raw colour "{{color}}" is not allowed. Use a design token — a Tailwind utility generated from @theme (e.g. text-ink, bg-paper) or var(--color-*). Colours are declared only in src/styles/tokens.css.',
    },
  },

  create(context) {
    const { sourceCode } = context;

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {unknown} value
     */
    const check = (node, value) => {
      const color = findRawColor(value);
      if (color) {
        context.report({ node, messageId: 'rawColor', data: { color } });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },

      TemplateElement(node) {
        check(node, node.value.raw);
      },

      /**
       * `<style>` and `<script>` bodies inside `.astro` components arrive as a
       * single AstroRawText node from astro-eslint-parser. Without this visitor
       * the rule silently misses scoped component CSS — which is exactly where
       * a stray colour is most likely to be written.
       *
       * astro-eslint-parser ships no types for its node kinds, so this is
       * annotated structurally rather than by importing a type that does not
       * exist.
       *
       * @param {import('eslint').Rule.Node} node
       */
      AstroRawText(node) {
        check(node, sourceCode.getText(node));
      },
    };
  },
};

export default rule;
