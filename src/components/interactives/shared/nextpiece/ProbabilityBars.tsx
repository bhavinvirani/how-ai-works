import { asPercent } from './logic';
import type { Scored } from './logic';

/**
 * A row of candidate next pieces, each with its share of the probability.
 *
 * THREE CUES, NEVER COLOUR ALONE (hard rule 9). The share is carried by the
 * length of the bar, by the printed percentage, and by the order of the rows.
 * The chosen piece is additionally marked with a shape, not a tint, so the
 * "this is the one that was drawn" signal survives greyscale.
 *
 * Text sits at full ink weight always. An earlier shared view faded whole rows
 * to show weight and dropped `text-ink` to 2.48:1 at the bottom of the range,
 * which axe caught — so nothing here ever varies the opacity of a glyph.
 *
 * No English lives in this file (hard rule 10). Labels arrive as formatters
 * from the calling instrument's `data.en.ts`.
 */

export interface ProbabilityBarsProps {
  row: readonly Scored[];
  /** Index of the piece that was actually drawn. Omit to show the row only. */
  chosen?: number;
  /** Names the list for screen readers. */
  label: string;
  /** Builds a row's accessible name, e.g. `(piece, 42) => "mild, 42 per cent"`. */
  describeRow?: (text: string, percent: number) => string;
  /** Marks the drawn row for screen readers, e.g. `(name) => name + ", chosen"`. */
  describeChosen?: (name: string) => string;
}

export function ProbabilityBars({
  row,
  chosen,
  label,
  describeRow,
  describeChosen,
}: ProbabilityBarsProps) {
  return (
    <ul aria-label={label} className="not-content flex flex-col gap-1 p-0">
      {row.map((entry, index) => {
        const percent = asPercent(entry.probability);
        const isChosen = index === chosen;

        const base = describeRow
          ? describeRow(entry.text, percent)
          : `${entry.text} ${String(percent)}`;
        const name = isChosen && describeChosen ? describeChosen(base) : base;

        return (
          <li
            key={entry.text}
            aria-label={name}
            className="flex items-center gap-2"
          >
            {/* The shape cue for the drawn piece. A caret, not a colour. */}
            <span
              aria-hidden="true"
              className="w-3 shrink-0 text-center font-mono text-xs text-accent"
            >
              {isChosen ? '▸' : ''}
            </span>

            <span
              aria-hidden="true"
              className={`w-24 shrink-0 truncate text-sm ${
                isChosen ? 'font-semibold text-ink' : 'text-ink'
              }`}
            >
              {entry.text}
            </span>

            <span
              aria-hidden="true"
              className="h-3 min-w-px flex-1 overflow-hidden rounded-sm bg-paper-sunken"
            >
              <span
                className={`block h-full rounded-sm ${
                  isChosen ? 'bg-accent' : 'bg-accent-2'
                }`}
                style={{ width: `${String(entry.probability * 100)}%` }}
              />
            </span>

            <span
              aria-hidden="true"
              className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted"
            >
              {percent}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
