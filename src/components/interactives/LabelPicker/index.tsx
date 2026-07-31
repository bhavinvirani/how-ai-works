import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl } from '../../primitives';
import {
  BIKE_NAMES,
  BUILT,
  CHOICE_LABELS,
  COLUMN_LABELS,
  formatCell,
  TEXT,
} from './data.en';
import {
  BIKES,
  COLUMNS,
  isAnswerColumn,
  LABEL_CHOICES,
  rankClues,
} from './logic';
import type { LabelChoice } from './logic';

export interface LabelPickerProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Starts on a nomination that already works, rather than on nothing. The
 * reader's first move should be *changing* the answer, not discovering that the
 * instrument needs switching on.
 */
const DEFAULT_CHOICE: LabelChoice = 'price';

/**
 * Teaches one thing: which column counts as the answer is a decision a person
 * makes, not a fact about the table.
 *
 * The ranked clue list is what stops this being a re-tinting exercise. Nominate
 * a different column and the ordering genuinely reshuffles — a different column
 * comes top each time — which is the claim of the unit, computed from the rows
 * rather than asserted in the prose beside it.
 *
 * No `StaticFallback`: nothing here needs hover or drag precision. The table is
 * wide, so it scrolls inside its own container rather than pushing the page
 * sideways on a phone.
 */
export function LabelPicker({ title, lead }: LabelPickerProps = {}) {
  const [choice, setChoice] = useState<LabelChoice>(DEFAULT_CHOICE);

  const copy = ui.interactives.LabelPicker;
  const clues = rankClues(choice);

  const strongestSentence =
    clues.length > 0
      ? TEXT.strongest(
          COLUMN_LABELS[clues[0].column],
          TEXT.percent(clues[0].strength),
        )
      : '';

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setChoice(DEFAULT_CHOICE);
      }}
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl<LabelChoice>
          label={TEXT.chooserLabel}
          value={choice}
          onChange={setChoice}
          options={LABEL_CHOICES.map((value) => ({
            value,
            label: CHOICE_LABELS[value],
          }))}
        />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{TEXT.tableCaption}</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th
                  scope="col"
                  className="px-2 py-1.5 text-xs font-medium text-ink"
                >
                  {TEXT.bikeColumn}
                </th>
                {COLUMNS.map((column) => {
                  const isAnswer = isAnswerColumn(column, choice);

                  return (
                    <th
                      key={column}
                      scope="col"
                      className={`px-2 py-1.5 ${isAnswer ? 'bg-accent-soft' : ''}`}
                    >
                      <span className="block text-xs font-medium text-ink">
                        {COLUMN_LABELS[column]}
                      </span>
                      {/*
                        The role is spelled out on every column, so the tint on
                        the nominated one is a second cue rather than the only
                        one (hard rule 9).
                      */}
                      <span
                        className={`block font-mono text-2xs tracking-wide uppercase ${
                          isAnswer ? 'text-accent' : 'text-ink-faint'
                        }`}
                      >
                        {isAnswer ? TEXT.roleAnswer : TEXT.roleClue}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {BIKES.map((bike) => (
                <tr
                  key={bike.id}
                  className="border-b border-rule last:border-0"
                >
                  <th
                    scope="row"
                    className="px-2 py-1.5 text-xs font-normal whitespace-nowrap text-ink-muted"
                  >
                    {BIKE_NAMES[bike.id]}
                  </th>
                  {COLUMNS.map((column) => (
                    <td
                      key={column}
                      className={`px-2 py-1.5 font-mono text-xs whitespace-nowrap text-ink ${
                        isAnswerColumn(column, choice) ? 'bg-accent-soft' : ''
                      }`}
                    >
                      {formatCell(bike, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-2xs text-ink-faint">{TEXT.honesty}</p>

        {/*
          Changing the nomination silently re-tints a column and reorders a
          list, neither of which a screen reader would announce. The sentence
          saying what machine now exists is the thing worth hearing, so it is
          the live region.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {BUILT[choice]} {strongestSentence}
        </p>

        {clues.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-ink-faint">{TEXT.cluesHeading}</p>

            <ul className="flex flex-col gap-2">
              {clues.map(({ column, strength }) => (
                <li key={column} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-ink-muted">
                    {COLUMN_LABELS[column]}
                  </span>
                  {/* Decorative: the number beside it carries the same value. */}
                  <span
                    aria-hidden="true"
                    className="block h-2 flex-1 overflow-hidden rounded-full bg-paper-sunken"
                  >
                    <span
                      className="block h-2 rounded-full bg-accent-2"
                      style={{ width: TEXT.percent(strength) }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-2xs text-ink-muted">
                    {TEXT.percent(strength)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{TEXT.noClues}</p>
        )}
      </div>
    </InstrumentPanel>
  );
}
