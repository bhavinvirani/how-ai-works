import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import {
  CLAIM_TEXT,
  ENDING_READOUT,
  ENDING_TAG,
  ENDING_TEXT,
  METER_RESULT_TEXT,
  RESULT_LABEL,
  TEXT,
  TOOL_TEXT,
  TURN_TEXT,
} from './data.en';
import {
  BRANCH_TURN,
  branchReached,
  claimHolds,
  clampTurns,
  contextAt,
  contextNow,
  contextPercent,
  DEFAULT_RESULT,
  DEFAULT_TURNS,
  endingClaims,
  endingKind,
  isFinished,
  isHeld,
  readingMultiple,
  RESULT_IDS,
  SHARED_TURNS,
  stepsIn,
  TOOL_IDS,
  totalRead,
  turnsShown,
  unsupportedClaims,
} from './logic';
import type { ResultId } from './logic';

export interface AgentTraceExplorerProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const SECTION_LABEL =
  'font-mono text-2xs tracking-wide text-ink-muted uppercase';

/**
 * Teaches one thing: the next step of an agent is not written down anywhere
 * before the run. It is chosen from whatever came back last — so changing one
 * result does not adjust the plan, it replaces it.
 *
 * THE BRANCH IS THE INSTRUMENT. Stepping through a fixed trace teaches the loop
 * and lets the reader keep assuming somebody wrote the sequence. So the same
 * goal, the same tools and the same first two turns are made to lead to three
 * runs that share no action after the branch, disagree about how long the job
 * is, and end three different ways. That is not a claim a paragraph makes stick.
 *
 * THE THIRD BRANCH IS THE POINT OF THE OTHER TWO. Two working runs would only
 * show capability. The third has a result that came back empty, an assumption
 * put in its place, and an email sent asserting something no tool returned — and
 * every turn of it is as reasonable-looking as the runs that worked. The panel
 * marks which statements rest on something only because `logic.ts` can check
 * the record; nothing in the writing separates them.
 *
 * The tokens each turn reads are printed against every row rather than totalled
 * at the end, because the growth is the half of the lesson a reader will
 * otherwise skip. It is the same budget the previous unit was about, being spent
 * by something that decides for itself how many times to spend it.
 *
 * No `StaticFallback`: a radio group, two buttons and a list of text rows need
 * no hover and no drag precision, and all of it works on a phone. Nothing
 * animates either, so `prefers-reduced-motion` has nothing to slow down — every
 * press redraws instantly.
 */
export function AgentTraceExplorer({
  title,
  lead,
}: AgentTraceExplorerProps = {}) {
  const [result, setResult] = useState<ResultId>(DEFAULT_RESULT);
  const [turns, setTurns] = useState(DEFAULT_TURNS);

  const copy = ui.interactives.AgentTraceExplorer;

  const shown = turnsShown(result, turns);
  const total = stepsIn(result);
  const finished = isFinished(result, turns);
  const kind = endingKind(result);
  const floating = unsupportedClaims(result);

  const readout = (): string => {
    if (!branchReached(result, turns)) return TEXT.beforeBranch(SHARED_TURNS);

    if (!finished) {
      return TEXT.midRun(shown.length, total, contextNow(result, turns));
    }

    return [
      ENDING_READOUT[kind],
      floating.length === 0 ? TEXT.allSound : TEXT.floating(floating.length),
      TEXT.cost(totalRead(result), readingMultiple(result)),
    ].join(' ');
  };

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setResult(DEFAULT_RESULT);
        setTurns(DEFAULT_TURNS);
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-rule bg-paper-sunken px-3 py-3">
          <p className={SECTION_LABEL}>{TEXT.goalLabel}</p>
          <p className="mt-1 text-sm text-ink">{TEXT.goal}</p>
        </div>

        {/* The held tool is marked in words, not by tint — the whole practical
            lesson is that this list is something a person wrote down. */}
        <div className="flex flex-col gap-1.5">
          <p className={SECTION_LABEL}>{TEXT.toolsLabel}</p>
          <ul className="flex flex-col gap-1">
            {TOOL_IDS.map((tool) => (
              <li
                key={tool}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs"
              >
                <span className="font-mono text-ink">
                  {TOOL_TEXT[tool].name}
                </span>
                <span className="text-ink-muted">{TOOL_TEXT[tool].does}</span>
                {isHeld(tool) ? (
                  <span className="rounded-sm border border-rule-strong px-1.5 py-0.5 font-mono text-2xs text-ink">
                    {TEXT.heldTag}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-faint">{TEXT.toolsNote}</p>
        </div>

        <SegmentedControl<ResultId>
          label={TEXT.resultLabel}
          value={result}
          onChange={(chosen) => {
            setResult(chosen);
            // The runs are not the same length, so a reader deep into the
            // longest one has to be pulled back to the end of a shorter.
            setTurns((current) => clampTurns(chosen, current));
          }}
          options={RESULT_IDS.map((id) => ({
            value: id,
            label: RESULT_LABEL[id],
          }))}
        />

        <Stepper
          label={TEXT.turnsLabel}
          value={clampTurns(result, turns)}
          onChange={setTurns}
          min={1}
          max={total}
          format={(value) => TEXT.turnsOf(value, total)}
        />

        <ol className="flex flex-col gap-2 p-0">
          {shown.map((turn, index) => {
            // The branch turn is the one row whose result is not fixed, so its
            // words are looked up by what the reader chose.
            const cameBack =
              turn.id === BRANCH_TURN
                ? METER_RESULT_TEXT[result]
                : TURN_TEXT[turn.id].result;

            return (
              <li
                key={turn.id}
                className="flex flex-col gap-1 rounded-md border border-rule bg-paper px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  {/* index + 1 is this row's position in the list, not any part
                      of the lesson's arithmetic — that lives in logic.ts. */}
                  <span className={SECTION_LABEL}>{TEXT.turn(index + 1)}</span>
                  <span className="shrink-0 font-mono text-2xs text-ink-faint">
                    {TEXT.reads(contextAt(result, index))}
                  </span>
                </div>

                {/* The bar is a second reading of the number beside it, never
                    the only one — hidden from screen readers for that reason. */}
                <div
                  aria-hidden="true"
                  className="h-1 w-full rounded-full bg-paper-sunken"
                >
                  <div
                    className="h-1 rounded-full bg-accent-2"
                    style={{
                      width: `${String(contextPercent(result, index))}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-ink-faint">
                  {TEXT.decidedLabel}
                </p>
                <p className="text-sm text-ink">{TURN_TEXT[turn.id].intent}</p>

                {turn.tool === null ? (
                  <p className="text-xs text-ink-faint">{TEXT.answeredLabel}</p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-ink-faint">
                      {isHeld(turn.tool) ? TEXT.refusedLabel : TEXT.ranLabel}
                    </p>
                    <p className="font-mono text-xs break-words text-ink">
                      {TURN_TEXT[turn.id].action}
                    </p>
                  </>
                )}

                {cameBack === '' ? null : (
                  <>
                    <p className="mt-1 text-xs text-ink-faint">
                      {TEXT.cameBackLabel}
                    </p>
                    <p className="text-sm text-ink-muted">{cameBack}</p>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        {finished ? (
          <div className="flex flex-col gap-2 rounded-md border border-rule bg-paper-sunken px-3 py-3">
            <p className={SECTION_LABEL}>{ENDING_TAG[kind]}</p>
            <p className="text-sm text-ink">{ENDING_TEXT[result].lead}</p>

            {/* Each statement says in words whether anything came back that
                supports it. The tinted edge is a repeat of that, never the
                carrier of it. */}
            <ul className="flex flex-col gap-2">
              {endingClaims(result).map((claim) => (
                <li
                  key={claim.id}
                  className={`rounded-sm border-l-2 py-1 pl-3 ${
                    claimHolds(result, claim)
                      ? 'border-l-accent-2'
                      : 'border-l-accent'
                  }`}
                >
                  <p className="text-sm text-ink">{CLAIM_TEXT[claim.id]}</p>
                  <p className={SECTION_LABEL}>
                    {claimHolds(result, claim)
                      ? TEXT.restsOn
                      : TEXT.restsOnNothing}
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-sm text-ink-muted">{ENDING_TEXT[result].note}</p>
          </div>
        ) : null}

        {/* The trace grows silently for anyone not looking at it, and the two
            things worth carrying away — what it finished by doing, and what
            that cost in reading — are both in here. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {readout()}
        </p>

        <p className="text-xs text-ink-faint">{TEXT.scaleNote}</p>
      </div>
    </InstrumentPanel>
  );
}
