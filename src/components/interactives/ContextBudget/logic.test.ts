import { describe, expect, it } from 'vitest';

import {
  clampStage,
  DEFAULT_STRATEGY,
  PRESET_IDS,
  PRESETS,
  readSoFar,
  STRATEGIES,
  SUMMARY_DIVISOR,
  typedSoFar,
  windowAt,
} from './logic';
import type { ItemId, Preset, Strategy } from './logic';

const CHAT = PRESETS.chat;
const RETRIEVAL = PRESETS.retrieval;

const everyBoard: readonly Preset[] = PRESET_IDS.map((id) => PRESETS[id]);

const stagesOf = (preset: Preset): readonly number[] =>
  Array.from({ length: preset.stream.length }, (_, index) => index + 1);

const idsInWindow = (
  preset: Preset,
  stage: number,
  strategy: Strategy,
): readonly ItemId[] =>
  windowAt(preset, stage, strategy)
    .items.filter(
      (placed) => placed.state === 'kept' || placed.state === 'pinned',
    )
    .map((placed) => placed.item.id);

const statesOf = (preset: Preset, stage: number, strategy: Strategy) =>
  windowAt(preset, stage, strategy).items.map((placed) => placed.state);

describe('the two boards', () => {
  it('leaves real room for a conversation after the fixed costs', () => {
    for (const preset of everyBoard) {
      const room =
        preset.capacity - preset.instructionTokens - preset.replyTokens;

      expect(room).toBeGreaterThan(0);
      // Whatever is pinned has to fit on its own, or the instrument would show
      // an impossible window rather than a full one.
      expect(room).toBeGreaterThan(
        Math.max(...preset.stream.map((item) => item.tokens)),
      );
    }
  });

  it('starts the reader somewhere that still fits', () => {
    for (const preset of everyBoard) {
      const opening = windowAt(preset, preset.defaultStage, DEFAULT_STRATEGY);

      expect(opening.overflowed).toBe(false);
      expect(preset.defaultStage).toBeLessThan(preset.stream.length);
    }
  });

  it('overflows before the stream runs out, on every board', () => {
    for (const preset of everyBoard) {
      for (const strategy of STRATEGIES) {
        expect(
          windowAt(preset, preset.stream.length, strategy).overflowed,
        ).toBe(true);
      }
    }
  });

  it('names a load-bearing item that is really in the stream', () => {
    for (const preset of everyBoard) {
      expect(preset.stream.map((item) => item.id)).toContain(preset.keyFact);
    }
  });

  it('pins the question on the retrieval board', () => {
    const question = RETRIEVAL.stream.find(
      (item) => item.id === 'rag-question',
    );

    expect(question?.pinned).toBe(true);
  });
});

describe('clampStage', () => {
  it('never goes below the first message', () => {
    expect(clampStage(CHAT, 0)).toBe(1);
    expect(clampStage(CHAT, -7)).toBe(1);
  });

  it('never goes past the end of the stream', () => {
    expect(clampStage(CHAT, 900)).toBe(CHAT.stream.length);
  });

  it('takes whole stages only', () => {
    expect(clampStage(CHAT, 4.4)).toBe(4);
    expect(clampStage(CHAT, 4.6)).toBe(5);
  });
});

describe('windowAt', () => {
  it('is deterministic — the same setting always gives the same window', () => {
    for (const strategy of STRATEGIES) {
      expect(idsInWindow(CHAT, 7, strategy)).toEqual(
        idsInWindow(CHAT, 7, strategy),
      );
    }
  });

  it('ignores a stage off either end', () => {
    expect(idsInWindow(CHAT, 0, 'oldest')).toEqual(
      idsInWindow(CHAT, 1, 'oldest'),
    );
    expect(idsInWindow(CHAT, 99, 'oldest')).toEqual(
      idsInWindow(CHAT, CHAT.stream.length, 'oldest'),
    );
  });

  it('accounts for every item exactly once', () => {
    for (const preset of everyBoard) {
      for (const strategy of STRATEGIES) {
        for (const stage of stagesOf(preset)) {
          const state = windowAt(preset, stage, strategy);

          expect(state.items).toHaveLength(stage);
          expect(
            new Set(state.items.map((placed) => placed.item.id)).size,
          ).toBe(stage);
        }
      }
    }
  });

  it('never evicts a pinned item or the newest one', () => {
    for (const preset of everyBoard) {
      for (const strategy of STRATEGIES) {
        for (const stage of stagesOf(preset)) {
          const state = windowAt(preset, stage, strategy);
          const gone = state.items.filter(
            (placed) =>
              placed.state === 'dropped' || placed.state === 'summarised',
          );

          for (const placed of gone) {
            expect(placed.item.pinned).not.toBe(true);
          }

          expect(state.items[stage - 1].state).toBe('pinned');
        }
      }
    }
  });

  it('lays survivors out in arrival order, end to end', () => {
    for (const strategy of STRATEGIES) {
      for (const stage of stagesOf(CHAT)) {
        const state = windowAt(CHAT, stage, strategy);
        const survivors = state.items.filter(
          (placed) => placed.state === 'kept' || placed.state === 'pinned',
        );

        let cursor = state.instructionTokens + state.summaryTokens;

        for (const placed of survivors) {
          expect(placed.start).toBe(cursor);
          cursor += placed.item.tokens;
        }
      }
    }
  });

  it('adds its own numbers up', () => {
    for (const preset of everyBoard) {
      for (const strategy of STRATEGIES) {
        for (const stage of stagesOf(preset)) {
          const state = windowAt(preset, stage, strategy);

          expect(state.read).toBe(
            state.instructionTokens + state.conversationTokens,
          );
          expect(state.used).toBe(state.read + state.replyTokens);
          expect(state.spare).toBe(state.capacity - state.used);
        }
      }
    }
  });
});

describe('readSoFar and typedSoFar', () => {
  it('starts at whatever the first turn cost', () => {
    expect(readSoFar(CHAT, 1, 'oldest')).toBe(windowAt(CHAT, 1, 'oldest').read);
  });

  it('only ever goes up', () => {
    for (const strategy of STRATEGIES) {
      for (let stage = 2; stage <= CHAT.stream.length; stage += 1) {
        expect(readSoFar(CHAT, stage, strategy)).toBeGreaterThan(
          readSoFar(CHAT, stage - 1, strategy),
        );
        expect(typedSoFar(CHAT, stage)).toBeGreaterThanOrEqual(
          typedSoFar(CHAT, stage - 1),
        );
      }
    }
  });

  it('counts only what the reader themselves put in', () => {
    expect(typedSoFar(CHAT, CHAT.stream.length)).toBe(
      CHAT.stream
        .filter((item) => item.kind === 'you')
        .reduce((total, item) => total + item.tokens, 0),
    );
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim `context-window.mdx` makes about this instrument is checked here,
 * so a later edit to a token count fails the build instead of quietly turning
 * the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('never grows the window, whatever is asked of it', () => {
    // The title of the panel is "Fill a window that does not grow". This is
    // that claim: one capacity, and nothing ever spills over it.
    for (const preset of everyBoard) {
      for (const strategy of STRATEGIES) {
        for (const stage of stagesOf(preset)) {
          const state = windowAt(preset, stage, strategy);

          expect(state.capacity).toBe(preset.capacity);
          expect(state.used).toBeLessThanOrEqual(preset.capacity);
          expect(state.spare).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('re-reads everything every turn, so reading badly outruns typing', () => {
    // Nothing is remembered, so nothing is read once. This is the whole unit,
    // as a ratio: five turns in, the reader has typed 125 tokens and the model
    // has read 1,945 — the same messages, over and over.
    expect(typedSoFar(CHAT, 5)).toBe(125);
    expect(readSoFar(CHAT, 5, 'oldest')).toBe(1945);

    for (const strategy of STRATEGIES) {
      expect(readSoFar(CHAT, 5, strategy)).toBeGreaterThan(
        typedSoFar(CHAT, 5) * 15,
      );
    }
  });

  it('reads more on each of the first five turns than the one before', () => {
    // The growing resend, before anything has had to be thrown away. Once the
    // window is full this necessarily stops — which is the next test.
    for (let stage = 2; stage <= 5; stage += 1) {
      expect(windowAt(CHAT, stage, 'oldest').read).toBeGreaterThan(
        windowAt(CHAT, stage - 1, 'oldest').read,
      );
    }
  });

  it('fits through turn five and cannot at turn six', () => {
    expect(windowAt(CHAT, 5, 'oldest').overflowed).toBe(false);
    expect(windowAt(CHAT, 5, 'oldest').conversationTokens).toBe(490);
    expect(windowAt(CHAT, 5, 'oldest').room).toBe(610);

    expect(windowAt(CHAT, 6, 'oldest').wantedTokens).toBe(740);
    expect(windowAt(CHAT, 6, 'oldest').overflowed).toBe(true);
  });

  it('throws away the budget at the first eviction, dropping the oldest', () => {
    // Turn one is the smallest message in the stream and carries the one
    // constraint the conversation depends on, so the cheapest thing to drop is
    // the thing it can least afford to lose. That is not bad luck; it is what
    // "oldest first" means.
    const sixth = windowAt(CHAT, 6, 'oldest');

    expect(statesOf(CHAT, 6, 'oldest').slice(0, 2)).toEqual([
      'dropped',
      'dropped',
    ]);
    expect(sixth.keyFactState).toBe('dropped');
    expect(idsInWindow(CHAT, 6, 'oldest')).toEqual([
      'chat-hills',
      'chat-replan',
      'chat-day-two',
      'chat-day-two-answer',
    ]);
  });

  it('lets one pasted message empty the window around it', () => {
    // Turn seven is a 480-token paste into 610 tokens of room. Dropping the
    // oldest, it is the only turn left standing.
    const paste = CHAT.stream.find((item) => item.id === 'chat-booking');

    expect(paste?.tokens).toBe(480);
    expect(idsInWindow(CHAT, 7, 'oldest')).toEqual(['chat-booking']);
  });

  it('costs something under every rule — none of the three is free', () => {
    for (const strategy of STRATEGIES) {
      const state = windowAt(CHAT, 9, strategy);
      const intact = state.items.filter(
        (placed) => placed.state === 'kept' || placed.state === 'pinned',
      );

      expect(intact.length).toBeLessThan(CHAT.stream.length);
    }
  });

  it('quotes what each rule costs by turn nine', () => {
    // Two turns survive, and the budget is gone.
    expect(idsInWindow(CHAT, 9, 'oldest')).toHaveLength(2);
    expect(windowAt(CHAT, 9, 'oldest').keyFactState).toBe('dropped');

    // Six survive, the budget among them — and what went instead is the paste
    // and two of the model's own answers.
    expect(idsInWindow(CHAT, 9, 'biggest')).toHaveLength(6);
    expect(windowAt(CHAT, 9, 'biggest').keyFactState).toBe('kept');
    expect(
      windowAt(CHAT, 9, 'biggest')
        .items.filter((placed) => placed.state === 'dropped')
        .map((placed) => placed.item.id),
    ).toEqual(['chat-day-two-answer', 'chat-booking', 'chat-booking-answer']);

    // Seven turns, 1,220 tokens of them, become a 153-token stand-in.
    const summarised = windowAt(CHAT, 9, 'summarise');

    expect(summarised.summaryTokens).toBe(153);
    expect(summarised.summarisedTokens).toBe(1220);
    expect(
      summarised.items.filter((placed) => placed.state === 'summarised'),
    ).toHaveLength(7);
    expect(summarised.keyFactState).toBe('summarised');
  });

  it('charges for the summary, at an eighth of what it replaces', () => {
    // A summary is not a way of keeping something for free. It is a smaller
    // thing standing where a bigger one used to be, and it still takes room.
    for (const stage of stagesOf(CHAT)) {
      const state = windowAt(CHAT, stage, 'summarise');

      if (state.summaryTokens === 0) continue;

      expect(state.summaryTokens).toBe(
        Math.ceil(state.summarisedTokens / SUMMARY_DIVISOR),
      );
      expect(state.summaryTokens).toBeLessThan(state.summarisedTokens);
      expect(state.conversationTokens).toBeLessThanOrEqual(state.room);
    }
  });

  it('quotes the five numbers the diagram writes on the page', () => {
    // ResendingTheThread.astro prints 145, 315, 355 and 550 down its right
    // edge, then 460 and 1,365 in its closing line. They are this instrument's
    // first four turns, sampled at build time.
    expect(windowAt(CHAT, 1, 'oldest').read).toBe(145);
    expect(windowAt(CHAT, 2, 'oldest').read).toBe(315);
    expect(windowAt(CHAT, 3, 'oldest').read).toBe(355);
    expect(windowAt(CHAT, 4, 'oldest').read).toBe(550);

    expect(windowAt(CHAT, 4, 'oldest').wantedTokens).toBe(460);
    expect(readSoFar(CHAT, 4, 'oldest')).toBe(1365);
  });

  it('does the same thing to fetched documents as to typed messages', () => {
    // The retrieval board, which `context-engineering` teaches from. Dropping
    // the oldest throws away the one page that answers the question, because a
    // window has no idea which of its contents matter.
    const full = windowAt(RETRIEVAL, RETRIEVAL.stream.length, 'oldest');

    expect(full.overflowed).toBe(true);
    expect(full.keyFactState).toBe('dropped');
    expect(
      windowAt(RETRIEVAL, RETRIEVAL.stream.length, 'oldest').items.find(
        (placed) => placed.item.id === 'rag-question',
      )?.state,
    ).not.toBe('dropped');
  });
});
