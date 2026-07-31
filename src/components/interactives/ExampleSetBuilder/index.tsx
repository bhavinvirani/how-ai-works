import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import { EXAMPLES, GRADE_LABELS, INSTRUCTION, MESSAGES, TEXT } from './data.en';
import {
  clampCount,
  exampleTokens,
  MIN_EXAMPLES,
  promptText,
  promptTokens,
  replyTo,
} from './logic';
import type { Grade, MessageId } from './logic';

export interface ExampleSetBuilderProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Nothing but the instruction, which is where a real prompt starts. Opening on
 * two examples would hand over the ending: the reader has to watch the format
 * arrive for its arrival to mean anything.
 */
const DEFAULT_COUNT = MIN_EXAMPLES;
const DEFAULT_MESSAGE: MessageId = 'plain';

/**
 * Teaches one thing: the first example fixes the format completely, and every
 * example after it is buying something narrower — a piece of house vocabulary,
 * a value outside the range already shown, or the one nobody thinks to write
 * down, which is a request that cannot be answered.
 *
 * The unanswerable request is the instrument's reason for existing. A reader
 * who only ever steps through the plain one concludes that two examples are
 * plenty and stops; stepping through the third with the examples going in one
 * at a time is what turns "include the awkward case" from advice into something
 * they watched happen — including the part where the model could handle it
 * before the examples went in, and could not afterwards.
 *
 * No fallback is passed to the panel: every control here is a button or a radio
 * and nothing depends on hover or drag precision, so the small-screen version
 * is the same instrument, only narrower.
 */
export function ExampleSetBuilder({
  title,
  lead,
}: ExampleSetBuilderProps = {}) {
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [messageId, setMessageId] = useState<MessageId>(DEFAULT_MESSAGE);

  const copy = ui.interactives.ExampleSetBuilder;
  const message =
    MESSAGES.find((candidate) => candidate.id === messageId) ?? MESSAGES[0];

  const shown = clampCount(count, EXAMPLES.length);
  const prompt = promptText(INSTRUCTION, EXAMPLES, shown, message);
  const reply = replyTo(message, shown);
  const total = promptTokens(INSTRUCTION, EXAMPLES, shown, message);
  const fromExamples = exampleTokens(INSTRUCTION, EXAMPLES, shown, message);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setCount(DEFAULT_COUNT);
        setMessageId(DEFAULT_MESSAGE);
      }}
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl<MessageId>
          label={TEXT.messageLabel}
          value={messageId}
          onChange={setMessageId}
          options={MESSAGES.map((candidate) => ({
            value: candidate.id,
            label: candidate.label,
          }))}
        />

        <Stepper
          label={TEXT.countLabel}
          value={shown}
          onChange={setCount}
          min={MIN_EXAMPLES}
          max={EXAMPLES.length}
          format={TEXT.countValue}
        />

        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.promptHeading}
          </p>
          {/*
            The literal string `promptTokens` counts, so the number underneath
            is a count of something the reader can see rather than a figure
            asserted beside it.
          */}
          <pre className="overflow-x-auto rounded-md border border-rule bg-paper-sunken px-3 py-2.5 font-mono text-2xs leading-relaxed whitespace-pre-wrap text-ink-muted">
            {prompt}
          </pre>
        </div>

        {/*
          Pressing + rewrites the prompt, the reply, the verdict and the bill
          all at once, and none of it is announced. The reply and what it costs
          are the lesson, so they are the live region — not the prompt, which
          would be read out in full on every press.
        */}
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.replyHeading}
          </p>

          <div
            className={`flex flex-col gap-1 rounded-md border px-3 py-2.5 ${SURFACE[reply.grade]}`}
          >
            <p className="font-mono text-xs leading-relaxed text-ink">
              {reply.text}
            </p>
            <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
              {GRADE_LABELS[reply.grade]}
            </p>
          </div>

          <p className="text-sm text-ink-muted">{reply.note}</p>
          <p className="text-sm text-ink-faint">
            {TEXT.cost(total, fromExamples)}
          </p>
        </div>
      </div>
    </InstrumentPanel>
  );
}

/**
 * Tone per verdict. Every one of these sits directly above the verdict spelled
 * out in words, so nothing here is the sole carrier of meaning (hard rule 9).
 */
const SURFACE: Record<Grade, string> = {
  unusable: 'border-rule bg-paper',
  wrong: 'border-warning/40 bg-warning-soft',
  invented: 'border-danger/40 bg-danger-soft',
  usable: 'border-success/40 bg-success-soft',
};
