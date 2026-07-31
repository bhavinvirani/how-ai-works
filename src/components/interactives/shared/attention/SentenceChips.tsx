import type { Token } from './logic';
import { asPercent } from './logic';

/**
 * A sentence as a row of chips, each showing how hard the word under
 * examination is leaning on it.
 *
 * THREE CUES, NEVER COLOUR ALONE (hard rule 9). Weight is carried by the depth
 * of the tint, by the thickness of the bar under each chip, and by a printed
 * percentage. Any one of the three read on its own gives the same ranking, so
 * the row survives greyscale, and a screen reader gets the number rather than
 * an impression.
 *
 * No English lives in here (hard rule 10). Every label — including the one a
 * screen reader hears for a chip — arrives as a formatter from the calling
 * instrument's `data.en.ts`.
 */

export interface SentenceChipsProps {
  sentence: readonly Token[];
  /**
   * One weight per word, summing to one. Omit to render the sentence plain,
   * which is what `OrderBlindness` shows before attention has run.
   */
  weights?: readonly number[];
  /** The word currently doing the looking. It is marked, not weighted. */
  focusIndex?: number;
  /** Makes the chips selectable. Omit for a read-only row. */
  onSelect?: (index: number) => void;
  /** Names the row for screen readers. Supplied by the caller's copy file. */
  label: string;
  /** Builds a chip's accessible name, e.g. `(word, 42) => "street, 42%"`. */
  describeChip?: (text: string, percent: number) => string;
}

export function SentenceChips({
  sentence,
  weights,
  focusIndex,
  onSelect,
  label,
  describeChip,
}: SentenceChipsProps) {
  const heaviest = weights ? Math.max(...weights) : 0;

  return (
    <ul
      aria-label={label}
      className="not-content flex list-none flex-wrap items-end gap-1.5 p-0"
    >
      {sentence.map((token, index) => {
        const weight = weights?.[index];
        const percent = weight === undefined ? undefined : asPercent(weight);

        // Scaled against the heaviest word rather than against 1, so a row that
        // spreads its attention thinly is still readable. The floor keeps a
        // near-zero word visible as "barely anything" rather than absent.
        const share =
          weight === undefined || heaviest === 0 ? 0 : weight / heaviest;
        const isFocus = index === focusIndex;

        const chip = (
          <>
            {/*
             * The tint is a LAYER BEHIND the word, not opacity on the chip.
             * Fading the whole chip fades the text with it: at a low weight
             * `text-ink` came out around 2.48:1 against the panel, which axe
             * caught as a real WCAG failure. Only the background varies now, so
             * the word stays at full ink weight however little attention it got.
             */}
            <span
              className={`relative block rounded-sm px-2 py-1 text-sm ${
                isFocus
                  ? 'bg-accent-soft font-semibold text-ink ring-2 ring-accent'
                  : 'text-ink'
              }`}
            >
              {weight === undefined || isFocus ? null : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-sm"
                  style={{
                    backgroundColor: 'var(--color-accent-2-soft)',
                    opacity: 0.35 + 0.65 * share,
                  }}
                />
              )}
              <span className="relative">{token.text}</span>
            </span>

            {percent === undefined ? null : (
              <>
                {/* The second cue: a bar whose width is the weight. */}
                <span
                  aria-hidden="true"
                  className="mt-1 block h-0.5 rounded-full bg-accent-2"
                  style={{ width: `${String(Math.max(6, share * 100))}%` }}
                />
                {/* The third: the number itself, which is also what a screen
                    reader gets when the chip is not a button. */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 block text-center font-mono text-2xs text-ink-faint"
                >
                  {percent}
                </span>
              </>
            )}
          </>
        );

        const accessibleName =
          describeChip && percent !== undefined
            ? describeChip(token.text, percent)
            : token.text;

        return (
          <li key={`${token.text}-${String(index)}`} className="flex flex-col">
            {onSelect ? (
              <button
                type="button"
                aria-pressed={isFocus}
                aria-label={accessibleName}
                onClick={() => {
                  onSelect(index);
                }}
                className="flex cursor-pointer flex-col rounded-sm transition-opacity duration-[var(--duration-fast)] ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {chip}
              </button>
            ) : (
              <span className="flex flex-col" aria-label={accessibleName}>
                {chip}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
