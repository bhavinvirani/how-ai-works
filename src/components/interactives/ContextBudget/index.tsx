import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import {
  ITEM_TEXT,
  PRESET_TEXT,
  STATE_TEXT,
  STRATEGY_TEXT,
  TEXT,
} from './data.en';
import {
  DEFAULT_PRESET,
  DEFAULT_STRATEGY,
  PRESETS,
  readSoFar,
  STRATEGIES,
  typedSoFar,
  windowAt,
} from './logic';
import type { PlacedItem, PresetId, Strategy } from './logic';

export interface ContextBudgetProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
  /**
   * WHICH BOARD TO SHOW. Optional, and it defaults to `'chat'`, which is the
   * board `context-window` teaches from: a plain conversation growing until it
   * stops fitting.
   *
   * `'retrieval'` is the same window filled the way a document-answering system
   * fills it — a long standing instruction, a little history, the question, and
   * five fetched pages of which one actually answers it. It exists for
   * `context-engineering`, later in the curriculum, and it is a preset rather
   * than a second instrument on purpose: the arithmetic is identical, and that
   * it is identical is most of what that unit has to say.
   *
   * A preset carries its own capacity, its own control labels, and its own
   * sentence for the moment the load-bearing piece is thrown away. Pass `title`
   * and `lead` alongside it — the defaults come from
   * `ui.interactives.ContextBudget`, which is written for the chat board.
   *
   * To add a third: `PresetId`, `ItemId`, `PRESETS` in `logic.ts`, then
   * `ITEM_TEXT` and `PRESET_TEXT` in `data.en.ts`. The `Record` types make the
   * second half of that a compile error rather than a blank row.
   */
  preset?: PresetId;
}

// Drawing geometry. Plain arithmetic rather than d3-scale, for the same reason
// as FlexibilityDial: one linear map does not justify an import. Everything the
// drawing *means* is computed in logic.ts and arrives already placed.
const VIEW = { width: 340, height: 96 };
const BAR = { left: 8, right: 332, top: 20, height: 30 };
const OUT = { top: 68, height: 14 };

/**
 * Lays everything that is no longer in the window out below it, left to right,
 * at the same scale as the window itself — so the pile that fell out can be
 * compared against the space that could not hold it.
 *
 * It is allowed to reach the right-hand edge and stop there. When the dropped
 * pile is wider than the whole window, that is the true statement, and the list
 * underneath names every piece regardless.
 *
 * Lives at module scope because a running offset is a mutation, and a mutation
 * inside a component body is a render that cannot be trusted to repeat.
 */
function laidOutBelow(
  pieces: readonly { id: string; width: number }[],
): { id: string; x: number; width: number }[] {
  const blocks: { id: string; x: number; width: number }[] = [];
  let cursor = BAR.left;

  for (const piece of pieces) {
    const width = Math.min(piece.width, BAR.right - cursor);
    if (width <= 0) break;

    blocks.push({ id: piece.id, x: cursor, width });
    cursor += width + 2;
  }

  return blocks;
}

/**
 * Teaches one thing: the window is a fixed number of tokens, the conversation
 * is not, and so a long enough conversation always reaches the point where the
 * only remaining question is what to throw away.
 *
 * The stepper is the whole design. A reader who is *told* that things fall out
 * of a conversation files it as a caveat; a reader who presses plus twice and
 * watches the message carrying the budget leave the window has seen it happen
 * to something they were following. The three rules for what to drop are there
 * so that nobody can conclude the fix is a better rule — every one of them
 * loses something, and the readout says what.
 *
 * Nothing animates, so `prefers-reduced-motion` has nothing to slow down: every
 * press redraws instantly.
 */
export function ContextBudget({
  title,
  lead,
  preset = DEFAULT_PRESET,
}: ContextBudgetProps = {}) {
  const board = PRESETS[preset];

  const [stage, setStage] = useState(board.defaultStage);
  const [strategy, setStrategy] = useState<Strategy>(DEFAULT_STRATEGY);

  const copy = ui.interactives.ContextBudget;
  const words = PRESET_TEXT[preset];

  const state = windowAt(board, stage, strategy);
  const perToken = (BAR.right - BAR.left) / state.capacity;

  const startX = (atToken: number) => BAR.left + atToken * perToken;
  const widthOf = (amount: number) => Math.max(1.5, amount * perToken - 1);

  const inWindow = state.items.filter(
    (placed) => placed.state === 'kept' || placed.state === 'pinned',
  );
  const summarised = state.items.filter(
    (placed) => placed.state === 'summarised',
  );
  const droppedCount = state.items.filter(
    (placed) => placed.state === 'dropped',
  ).length;

  const outBlocks = laidOutBelow(
    state.items
      .filter((placed) => placed.state !== 'kept' && placed.state !== 'pinned')
      .map((placed) => ({
        id: placed.item.id,
        width: widthOf(placed.item.tokens),
      })),
  );

  const keyFactSentence =
    state.keyFactState === 'dropped'
      ? words.keyFactDropped
      : state.keyFactState === 'summarised'
        ? words.keyFactSummarised
        : state.keyFactState === 'unsaid'
          ? ''
          : words.keyFactSafe;

  const fate =
    state.summaryTokens > 0
      ? TEXT.summaryLine(
          state.summaryTokens,
          state.summarisedTokens,
          summarised.length,
        )
      : droppedCount > 0
        ? TEXT.droppedSome(droppedCount, inWindow.length)
        : TEXT.roomLeft(state.spare);

  const asRow = (placed: PlacedItem) => ({
    key: placed.item.id,
    text: ITEM_TEXT[placed.item.id],
    meta: TEXT.rowMeta(placed.item.tokens, STATE_TEXT[placed.state]),
  });

  // Replaced pieces are grouped ahead of the stand-in that replaced them, which
  // is the only place the order departs from arrival order — and the only place
  // where saying "these four are now this one" is worth more than the sequence.
  const listRows = [
    ...summarised.map(asRow),
    ...(state.summaryTokens > 0
      ? [
          {
            key: 'summary',
            text: TEXT.summaryRow(summarised.length),
            meta: TEXT.rowMeta(state.summaryTokens, STATE_TEXT.kept),
          },
        ]
      : []),
    ...state.items.filter((placed) => placed.state !== 'summarised').map(asRow),
  ];

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setStage(board.defaultStage);
        setStrategy(DEFAULT_STRATEGY);
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Silent for anyone not looking at it, which is why every number in it
            is also in the readout below. Nothing here is carried by colour: the
            two things that are not messages sit at fixed ends of the bar, and
            the list underneath names all of it in words. */}
        <svg
          viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
          className="w-full"
          aria-hidden="true"
        >
          <text
            x={BAR.left}
            y={13}
            className="fill-ink-faint font-mono"
            fontSize="7"
          >
            {TEXT.windowLabel(state.capacity)}
          </text>

          <rect
            x={BAR.left}
            y={BAR.top}
            width={BAR.right - BAR.left}
            height={BAR.height}
            rx="3"
            className="fill-paper-sunken stroke-rule-strong"
            strokeWidth="1"
          />

          <rect
            x={BAR.left}
            y={BAR.top}
            width={widthOf(state.instructionTokens)}
            height={BAR.height}
            rx="2"
            className="fill-accent-2-soft stroke-accent-2"
            strokeWidth="1"
          />

          {state.summaryTokens > 0 ? (
            <rect
              x={startX(state.instructionTokens)}
              y={BAR.top}
              width={widthOf(state.summaryTokens)}
              height={BAR.height}
              rx="2"
              className="fill-accent-2-soft stroke-accent-2"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          ) : null}

          {inWindow.map((placed) => (
            <rect
              key={placed.item.id}
              x={startX(placed.start)}
              y={BAR.top}
              width={widthOf(placed.item.tokens)}
              height={BAR.height}
              rx="2"
              className={
                placed.item.id === board.keyFact
                  ? 'fill-paper-raised stroke-accent'
                  : 'fill-paper-raised stroke-rule-strong'
              }
              strokeWidth={placed.item.id === board.keyFact ? '2' : '1'}
            />
          ))}

          {/* The reply. Always at the far right, always empty — the answer is
              written into the same window the question arrived in. */}
          <rect
            x={startX(state.capacity - state.replyTokens)}
            y={BAR.top}
            width={widthOf(state.replyTokens)}
            height={BAR.height}
            rx="2"
            className="fill-paper stroke-rule-strong"
            strokeWidth="1"
            strokeDasharray="3 2"
          />

          {outBlocks.length > 0 ? (
            <>
              <text
                x={BAR.left}
                y={62}
                className="fill-ink-faint font-mono"
                fontSize="7"
              >
                {TEXT.droppedLabel}
              </text>

              {outBlocks.map((block) => (
                <rect
                  key={block.id}
                  x={block.x}
                  y={OUT.top}
                  width={block.width}
                  height={OUT.height}
                  rx="2"
                  className={
                    block.id === board.keyFact
                      ? 'fill-paper stroke-accent'
                      : 'fill-paper stroke-rule'
                  }
                  strokeWidth="1"
                  strokeDasharray="3 2"
                />
              ))}
            </>
          ) : null}
        </svg>

        <p className="font-mono text-2xs text-ink-faint">
          {TEXT.tally(
            state.instructionTokens,
            state.conversationTokens,
            state.replyTokens,
            state.spare,
          )}
        </p>

        {/* The drawing changes silently, and the last sentence here is the one
            the unit is actually about, so this is the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {[
            TEXT.inUse(state.used, state.capacity),
            fate,
            keyFactSentence,
            TEXT.reread(
              readSoFar(board, stage, strategy),
              typedSoFar(board, stage),
            ),
          ]
            .filter((sentence) => sentence !== '')
            .join(' ')}
        </p>

        <Stepper
          label={words.stageLabel}
          value={stage}
          onChange={setStage}
          min={1}
          max={board.stream.length}
          step={1}
          format={words.stageValue}
        />

        <div className="flex flex-col gap-1.5">
          <SegmentedControl<Strategy>
            label={TEXT.strategyLabel}
            value={strategy}
            onChange={setStrategy}
            options={STRATEGIES.map((id) => ({
              value: id,
              label: STRATEGY_TEXT[id].label,
            }))}
          />
          <p className="text-xs text-ink-faint">
            {STRATEGY_TEXT[strategy].description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-ink-faint">{TEXT.listLabel}</p>

          {/* The list, not the drawing, is where the meaning lives: every row
              says in words where that piece ended up. Summarised pieces are
              grouped ahead of the stand-in that replaced them. */}
          <ul className="flex flex-col gap-1">
            {listRows.map((row) => (
              <li
                key={row.key}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="text-ink-muted">{row.text}</span>
                <span className="shrink-0 font-mono text-ink-faint">
                  {row.meta}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-faint">{TEXT.scaleNote}</p>
      </div>
    </InstrumentPanel>
  );
}
