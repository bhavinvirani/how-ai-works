import { useState } from 'react';

import { ui } from '../../../copy/en';
import {
  InstrumentPanel,
  SegmentedControl,
  Slider,
  Toggle,
} from '../../primitives';
import type { SegmentedOption } from '../../primitives';
import {
  DOC_TEXT,
  DOC_TITLE,
  LINE_LABEL,
  QUESTION_LABEL,
  QUESTION_TEXT,
  TAGS,
  TEXT,
} from './data.en';
import {
  itemById,
  MAX_PIECE,
  MIN_PIECE,
  PIECE_STEP,
  pieceOwning,
  questionById,
  QUESTIONS,
  search,
} from './logic';
import type { ItemId, PieceItem, QuestionId } from './logic';

export interface ChunkCutterProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * The widest cut, because the panel's lead asks the reader to start with big
 * pieces and work down. It is also the setting at which the first question
 * succeeds, so the reader's first look is at a search that works — which is
 * what makes the second look worth taking.
 */
const DEFAULT_QUESTION: QuestionId = 'dinner';
const DEFAULT_SIZE = MAX_PIECE;
const DEFAULT_OVERLAP = false;
const DEFAULT_CARRY_HEADING = false;

const QUESTION_OPTIONS: readonly SegmentedOption<QuestionId>[] = QUESTIONS.map(
  (question) => ({ value: question.id, label: QUESTION_LABEL[question.id] }),
);

const ROLE_TAG: Record<PieceItem['role'], string | null> = {
  own: null,
  repeated: TAGS.repeated,
  carried: TAGS.carried,
};

/**
 * Teaches one thing: a piece of a document can be retrieved only if it says
 * what it is about, and no size of cut can put back a subject the words never
 * mention.
 *
 * WHY THE ANSWER IS LABELLED RATHER THAN HIDDEN. A guessing game would teach a
 * different lesson. Here the reader is shown exactly which line answers the
 * question, watches it sit in the document in full view, and watches it not
 * come back at any of the eight sizes — with the score on its piece reading
 * 0.00 the whole time. Being unable to find something you can see is the
 * experience this unit exists to produce; hiding it would only produce a puzzle.
 *
 * WHY THE TWO SWITCHES ARE SEPARATE. Overlap is the fix everyone reaches for
 * first, and on the first question it works. On the second it rescues the line
 * at two of the eight sizes, by luck, when the cut happens to fall so that the
 * line above comes along. Stamping the heading works at all eight. A reader who
 * only ever saw them together would conclude that "we added overlap" was the
 * fix, which is the mistake this panel is trying to prevent.
 *
 * No fallback is passed to the panel: a slider, a radio group, two switches and
 * a column of text, none of which need hover or drag precision, and all of
 * which work at a phone width. Nothing animates, so `prefers-reduced-motion`
 * has nothing to slow down — every recut appears the instant it is asked for.
 */
export function ChunkCutter({ title, lead }: ChunkCutterProps = {}) {
  const [question, setQuestion] = useState<QuestionId>(DEFAULT_QUESTION);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [overlap, setOverlap] = useState(DEFAULT_OVERLAP);
  const [carryHeading, setCarryHeading] = useState(DEFAULT_CARRY_HEADING);

  const copy = ui.interactives.ChunkCutter;

  const outcome = search(
    question,
    { maxWords: size, overlap, carryHeading },
    DOC_TEXT,
  );

  const needed = new Set<ItemId>(questionById(question).needs);

  const readout = (): string => {
    const returned = outcome.returned.length;

    if (outcome.missing.length === 0) {
      return TEXT.readoutFound(
        outcome.found.map((id) => LINE_LABEL[id]),
        returned,
      );
    }

    const lost = outcome.missing.map((id) => LINE_LABEL[id]);
    const holder = pieceOwning(outcome, outcome.missing[0]);
    const holderScore = holder === null ? 0 : holder.score;

    return holderScore === 0
      ? TEXT.readoutNothingInCommon(lost, returned)
      : TEXT.readoutMissing(lost, returned, holderScore);
  };

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setQuestion(DEFAULT_QUESTION);
        setSize(DEFAULT_SIZE);
        setOverlap(DEFAULT_OVERLAP);
        setCarryHeading(DEFAULT_CARRY_HEADING);
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{TEXT.intro}</p>

        <SegmentedControl<QuestionId>
          label={TEXT.questionLabel}
          options={QUESTION_OPTIONS}
          value={question}
          onChange={setQuestion}
        />

        <div className="rounded-md border border-rule bg-paper-sunken px-3 py-3">
          <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
            {TEXT.askedHeading}
          </p>
          <p className="mt-1 text-sm text-ink">{QUESTION_TEXT[question]}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
            {TEXT.documentHeading} — {DOC_TITLE}
          </p>

          <ol className="flex flex-col gap-2">
            {outcome.pieces.map((scored) => (
              <li
                key={`piece-${String(scored.order)}`}
                className={`rounded-md border px-3 py-2 ${
                  scored.rank === null
                    ? 'border-rule bg-paper'
                    : 'border-accent-2 bg-accent-2-soft'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                    {TEXT.pieceName(scored.order + 1)}
                  </span>
                  <span className="font-mono text-2xs text-ink-faint">
                    {TEXT.pieceMeta(scored.piece.words, scored.score)}
                  </span>
                </div>

                {scored.rank === null ? null : (
                  <p className="font-mono text-2xs tracking-wide text-ink uppercase">
                    {TEXT.returnedTag(scored.rank)}
                  </p>
                )}

                <ul className="mt-1.5 flex flex-col gap-1">
                  {scored.piece.items.map((entry) => {
                    const tag = ROLE_TAG[entry.role];
                    const isHeading = itemById(entry.id).kind === 'heading';
                    const answers =
                      needed.has(entry.id) && entry.role === 'own';

                    return (
                      <li
                        key={`${String(scored.order)}-${entry.id}-${entry.role}`}
                        className={
                          answers
                            ? 'border-l-2 border-l-accent pl-2'
                            : undefined
                        }
                      >
                        {tag === null ? null : (
                          <span className="block font-mono text-2xs text-ink-faint">
                            {tag}
                          </span>
                        )}
                        <span
                          className={
                            isHeading
                              ? 'font-display text-sm font-semibold text-ink'
                              : 'text-sm text-ink'
                          }
                        >
                          {DOC_TEXT[entry.id]}
                        </span>
                        {answers ? (
                          <span className="block font-mono text-2xs text-accent">
                            {TAGS.answers}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </div>

        <Slider
          label={TEXT.sizeLabel}
          description={TEXT.sizeDescription}
          value={size}
          onChange={setSize}
          min={MIN_PIECE}
          max={MAX_PIECE}
          step={PIECE_STEP}
          format={TEXT.sizeValue}
        />

        <Toggle
          label={TEXT.overlapLabel}
          description={TEXT.overlapDescription}
          checked={overlap}
          onChange={setOverlap}
        />

        <Toggle
          label={TEXT.headingLabel}
          description={TEXT.headingDescription}
          checked={carryHeading}
          onChange={setCarryHeading}
        />

        {/* The whole document rearranges silently for anyone not looking at it,
            and what came back is the only thing being asked about, so the
            verdict is repeated here in one region rather than left to the
            tinted pieces. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {readout()}
        </p>
      </div>
    </InstrumentPanel>
  );
}
