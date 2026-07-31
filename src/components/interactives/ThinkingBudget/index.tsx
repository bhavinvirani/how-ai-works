import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Slider } from '../../primitives';
import { ANSWER_TEXT, QUESTION_TEXT, STEP_TEXT, TEXT } from './data.en';
import {
  costMultiple,
  DEFAULT_QUESTION,
  DEFAULT_ROOM,
  MAX_ROOM,
  MIN_ROOM,
  QUESTION_IDS,
  ROOM_STEP,
  runAt,
} from './logic';
import type { QuestionId } from './logic';

export interface ThinkingBudgetProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

// Drawing geometry. Plain arithmetic rather than d3-scale, for the same reason
// as ContextBudget: one linear map does not justify an import. Everything the
// drawing *means* is computed in logic.ts and arrives already measured.
const VIEW = { width: 340, height: 50 };
const BAR = { left: 8, right: 332, top: 14, height: 26 };
const BLOCK = { top: 18, height: 18 };

const PER_TOKEN = (BAR.right - BAR.left) / MAX_ROOM;

const startX = (atToken: number) => BAR.left + atToken * PER_TOKEN;
const widthOf = (amount: number) => Math.max(1.5, amount * PER_TOKEN - 1);

/**
 * Teaches one thing: room to think is a resource spent in tokens, and whether
 * spending it helps is a fact about the question, not about the machine.
 *
 * The four questions are the design. A single slider that only ever made
 * answers better would teach the opposite of the truth — so one question is
 * rescued by the room, one is untouched by it while the bill climbs
 * twelvefold, and two are actively spoiled by it. The reader who sets the
 * slider to fifty and steps across all four meets all of that in four clicks.
 *
 * The bar is deliberately about the working only. The answer is produced
 * whatever the budget says and is never limited by it, so putting it on the
 * same axis would draw a constraint that does not exist. It is named, with its
 * token count, in the readout underneath instead.
 *
 * No `StaticFallback`: a radio group and a range input are both operable by tap
 * and by keyboard, and nothing here needs hover or drag precision. Nothing
 * animates either, so `prefers-reduced-motion` has nothing to slow down — every
 * change redraws instantly.
 */
export function ThinkingBudget({ title, lead }: ThinkingBudgetProps = {}) {
  const [question, setQuestion] = useState<QuestionId>(DEFAULT_QUESTION);
  const [room, setRoom] = useState(DEFAULT_ROOM);

  const copy = ui.interactives.ThinkingBudget;
  const asked = QUESTION_TEXT[question];

  const run = runAt(question, room);
  const answer = ANSWER_TEXT[run.answer.id];
  const multiple = costMultiple(question, run.room);

  const budgetNote =
    run.room === 0
      ? ''
      : run.written === 0
        ? TEXT.tooTight
        : run.unwritten > 0
          ? TEXT.cutShort(run.unwritten)
          : run.spare > 0
            ? TEXT.spare(run.spare)
            : '';

  const readout = [
    answer.verdict,
    TEXT.produced(run.passes, run.workingTokens, run.answer.tokens),
    multiple > 1 ? TEXT.multiple(multiple) : '',
    budgetNote,
  ]
    .filter((sentence) => sentence !== '')
    .join(' ');

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setQuestion(DEFAULT_QUESTION);
        setRoom(DEFAULT_ROOM);
      }}
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl<QuestionId>
          label={TEXT.chooseLabel}
          value={question}
          onChange={setQuestion}
          options={QUESTION_IDS.map((id) => ({
            value: id,
            label: QUESTION_TEXT[id].label,
          }))}
        />

        <div className="flex flex-col gap-1">
          <p className="text-xs text-ink-faint">{TEXT.questionLabel}</p>
          <p className="text-sm text-ink">{asked.prompt}</p>
        </div>

        <Slider
          label={TEXT.roomLabel}
          description={TEXT.roomDescription}
          value={room}
          onChange={setRoom}
          min={MIN_ROOM}
          max={MAX_ROOM}
          step={ROOM_STEP}
          format={TEXT.roomValue}
        />

        {/* Silent for anyone not looking at it, and nothing here is carried by
            colour: the room granted is an outlined stretch of the track, a line
            that was written is a solid block inside it, and a line there was no
            room for is a dashed block past its edge. The list underneath names
            every one of them in words. */}
        <svg
          viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
          className="w-full"
          aria-hidden="true"
        >
          <rect
            x={BAR.left}
            y={BAR.top}
            width={BAR.right - BAR.left}
            height={BAR.height}
            rx="3"
            className="fill-paper stroke-rule"
            strokeWidth="1"
          />

          {run.room > 0 ? (
            <rect
              x={BAR.left}
              y={BAR.top}
              width={widthOf(run.room)}
              height={BAR.height}
              rx="3"
              className="fill-paper-sunken stroke-rule-strong"
              strokeWidth="1.5"
            />
          ) : null}

          {run.lines.map((line) => (
            <rect
              key={line.step.id}
              x={startX(line.startsAt)}
              y={BLOCK.top}
              width={widthOf(line.step.tokens)}
              height={BLOCK.height}
              rx="2"
              className={
                line.written
                  ? 'fill-paper-raised stroke-rule-strong'
                  : 'fill-paper stroke-rule'
              }
              strokeWidth="1"
              strokeDasharray={line.written ? undefined : '3 2'}
            />
          ))}
        </svg>

        {/* The list, not the drawing, is where the meaning lives: every row says
            in words what it wrote, and every row it had no room for says that
            too — including, for one setting of this slider, the line that would
            have caught the mistake. */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-ink-faint">{TEXT.workingLabel}</p>

          {run.written === 0 ? (
            <p className="text-sm text-ink-muted">{TEXT.noWorking}</p>
          ) : null}

          <ol className="flex flex-col gap-1 p-0">
            {run.lines.map((line) => (
              <li
                key={line.step.id}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className={line.written ? 'text-ink' : 'text-ink-faint'}>
                  {STEP_TEXT[line.step.id]}
                </span>
                <span className="shrink-0 font-mono text-ink-faint">
                  {line.written ? TEXT.written : TEXT.unwritten}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-1 border-t border-rule pt-3">
          <p className="text-xs text-ink-faint">{TEXT.answerLabel}</p>
          <p className="text-sm text-ink">{answer.text}</p>
        </div>

        {/* The answer and the bill both change silently for anyone not looking,
            and between them they are the whole lesson. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {readout}
        </p>

        <p className="text-xs text-ink-faint">{TEXT.scaleNote}</p>
      </div>
    </InstrumentPanel>
  );
}
