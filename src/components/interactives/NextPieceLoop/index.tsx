import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import { ProbabilityBars } from '../shared/nextpiece/ProbabilityBars';
import { STARTS, TEXT } from './data.en';
import {
  GIVEN_PIECES,
  LONG_SHOT_ONE_IN,
  LONG_SHOT_SHARE,
  LONG_SHOT_TEXT,
  piecesOf,
  readingFor,
  START_IDS,
} from './logic';
import type { StartId } from './logic';

export interface NextPieceLoopProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const DEFAULT_START: StartId = 'ordinary';
const DEFAULT_WRITTEN = 0;

/** The shape that marks the newest piece, so the mark survives greyscale. */
const NEWEST_MARK = '▸';
/** Where the next piece would land. Decorative; the readout says it in words. */
const CARET = '▌';

/**
 * Teaches one thing: the model writes a single piece, glues it on the end,
 * reads the whole thing back, and only then works out what could come next — so
 * it never had a plan, and nothing in the loop can take a piece back.
 *
 * The counter is the control, not a play button, for the same reason
 * TrainingLoopRunner uses one: the reader has to make each pass happen by hand
 * or the loop looks like an animation of a sentence appearing. Pressing it once
 * and reading the row is the whole exercise; the count of pieces re-read, which
 * goes up by exactly one every press, is the evidence for the first claim.
 *
 * The second start is the evidence for the second claim, and it is the reason
 * this instrument is not a decoration. It picks the run up one piece later,
 * after the model has drawn the poorest piece in the opening row — something it
 * does about once in 270 runs — and the row it then produces contains no
 * apology, no deletion and no way back to the start. It carries on, because
 * carrying on is the only thing it can do.
 *
 * Nothing animates, so `prefers-reduced-motion` has nothing to slow down: every
 * press redraws instantly.
 */
export function NextPieceLoop({ title, lead }: NextPieceLoopProps = {}) {
  const [start, setStart] = useState<StartId>(DEFAULT_START);
  const [written, setWritten] = useState(DEFAULT_WRITTEN);

  const copy = ui.interactives.NextPieceLoop;
  const reading = readingFor(start, written);
  const opening = piecesOf(reading.opening);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setStart(DEFAULT_START);
        setWritten(DEFAULT_WRITTEN);
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Every piece is a box of its own, so the joins are carried by the
            gaps rather than by any colour (hard rule 9); the newest piece takes
            a caret and a heavier face as well as an outline. Silent for anyone
            not looking at it, which is why the readout below names the whole
            sentence in words. */}
        <div
          aria-hidden="true"
          className="flex min-h-14 flex-wrap content-start items-center gap-1 rounded-md border border-rule bg-paper-sunken p-2"
        >
          {opening.map((piece, index) => (
            <span
              key={`opening-${String(index)}`}
              className={
                index < GIVEN_PIECES
                  ? 'rounded-sm border border-rule-strong bg-paper px-1.5 py-0.5 font-mono text-xs text-ink'
                  : 'rounded-sm border border-accent bg-paper-raised px-1.5 py-0.5 font-mono text-xs text-ink'
              }
            >
              {piece}
            </span>
          ))}

          {reading.pieces.map((piece) => (
            <span
              key={piece.index}
              className={
                piece.index === reading.written
                  ? 'rounded-sm border border-accent bg-paper-raised px-1.5 py-0.5 font-mono text-xs font-semibold text-ink'
                  : 'rounded-sm border border-accent bg-paper-raised px-1.5 py-0.5 font-mono text-xs text-ink'
              }
            >
              {piece.index === reading.written ? `${NEWEST_MARK} ` : ''}
              {piece.text}
            </span>
          ))}

          {reading.finished ? null : (
            <span className="font-mono text-xs text-ink-faint">{CARET}</span>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-rule pt-3">
          <p className="text-sm font-medium text-ink">
            {reading.written === 0
              ? TEXT.rowFirst(reading.contextPieces)
              : TEXT.rowAfter(reading.contextPieces)}
          </p>

          <ProbabilityBars
            row={reading.row}
            chosen={reading.chosen}
            label={TEXT.barsLabel}
            describeRow={TEXT.describeRow}
            describeChosen={TEXT.describeChosen}
          />

          {reading.roundsToZero ? (
            <p className="text-2xs text-ink-faint">
              {TEXT.rounding(LONG_SHOT_TEXT, LONG_SHOT_SHARE, LONG_SHOT_ONE_IN)}
            </p>
          ) : null}
        </div>

        {reading.pieces.length > 0 ? (
          <div className="rounded-md border border-rule bg-paper px-3 py-2">
            <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
              {TEXT.trailHeading}
            </p>
            <ol className="mt-2 flex flex-col gap-1">
              {reading.pieces.map((piece) => (
                <li key={piece.index} className="text-sm text-ink-muted">
                  {TEXT.trailLine(piece)}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <SegmentedControl<StartId>
          label={TEXT.startLabel}
          value={start}
          onChange={setStart}
          options={START_IDS.map((id) => ({ value: id, label: STARTS[id] }))}
        />

        <Stepper
          label={TEXT.stepperLabel}
          value={reading.written}
          onChange={setWritten}
          min={0}
          max={reading.total}
          step={1}
          format={TEXT.stepperValue}
        />

        {/* A press silently rewrites the sentence, the row and the trail at
            once, and the story of what just happened is the whole lesson, so
            this is the live region rather than everything that moved. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {reading.latest
            ? [
                TEXT.drew(reading.latest),
                reading.latest.favourite
                  ? TEXT.tookTheTop
                  : TEXT.tookAnOutsider(
                      reading.favouriteText,
                      reading.favouritePercent,
                    ),
                reading.start === 'stuck' && reading.written === 1
                  ? TEXT.noWayBack(LONG_SHOT_TEXT)
                  : '',
                reading.finished ? TEXT.ended : TEXT.grows(reading.latest.read),
                TEXT.written(reading.sentence),
              ]
                .filter((sentence) => sentence !== '')
                .join(' ')
            : TEXT.waiting(
                reading.contextPieces,
                reading.favouriteText,
                reading.favouritePercent,
              )}
        </p>
      </div>
    </InstrumentPanel>
  );
}
