/**
 * Pure logic for ContextBudget (§3.3).
 *
 * The instrument teaches one thing: a model keeps nothing between messages, so
 * the whole conversation is sent again every turn — and because the window it
 * arrives in is a fixed number of tokens, a conversation that keeps growing
 * eventually has to throw something away. The only question left is what.
 *
 * TWO BOARDS, ONE MECHANISM. `context-window` uses the `chat` preset: a plain
 * conversation filling up. `context-engineering`, later in the curriculum,
 * uses `retrieval`: a long standing instruction, a little history, and five
 * fetched documents competing for the same room. They are presets rather than
 * two instruments because the arithmetic is identical and the lesson is that it
 * is identical — a document you pasted and a message you typed are the same
 * kind of thing to a window, and neither gets special treatment.
 *
 * ADDING A PRESET. Add an id to `PresetId`, the item ids to `ItemId`, an entry
 * to `PRESETS`, and the matching gists to `ITEM_TEXT` in `data.en.ts`. That
 * last one is not optional in practice: `ITEM_TEXT` is a `Record<ItemId, …>`,
 * so a new item with no words fails to compile rather than rendering a blank
 * row. Keep `capacity - instructionTokens - replyTokens` smaller than the sum
 * of the stream, or nothing ever overflows and the instrument teaches nothing.
 *
 * WHAT CANNOT BE DROPPED. The newest item in play, always — there is no sense
 * in a window that has thrown away the message it is answering — plus anything
 * flagged `pinned`. The retrieval preset pins the question for the same reason.
 *
 * The window here is a thousand tokens, which is roughly a hundredth of a small
 * production one. That is the right shape at the wrong size, and `data.en.ts`
 * says so on the page: real windows fill up the same way, just later.
 *
 * Nothing is random and nothing reads a clock, so turn six drops turns one and
 * two today and in two years — which is what lets the prose, the
 * `ResendingTheThread` diagram and the tests all quote one set of numbers.
 */

export type PresetId = 'chat' | 'retrieval';

/** Who put this in the window. Carried for the reader, not for the arithmetic. */
export type ItemKind = 'you' | 'it' | 'document';

export type ItemId =
  | 'chat-brief'
  | 'chat-plan'
  | 'chat-hills'
  | 'chat-replan'
  | 'chat-day-two'
  | 'chat-day-two-answer'
  | 'chat-booking'
  | 'chat-booking-answer'
  | 'chat-afford'
  | 'rag-earlier-question'
  | 'rag-earlier-answer'
  | 'rag-question'
  | 'rag-returns'
  | 'rag-shipping'
  | 'rag-old-returns'
  | 'rag-warranty'
  | 'rag-thread';

export interface StreamItem {
  readonly id: ItemId;
  readonly kind: ItemKind;
  /** What this costs the window. */
  readonly tokens: number;
  /** Never evicted, however full it gets. The newest item is pinned as well. */
  readonly pinned?: boolean;
}

export interface Preset {
  readonly id: PresetId;
  /** The whole window, in tokens. Fixed — this is the point of the instrument. */
  readonly capacity: number;
  /** Standing instructions, sent before the reader has typed anything. */
  readonly instructionTokens: number;
  /** Room kept clear for the reply. The answer is written into the same window. */
  readonly replyTokens: number;
  /** Everything that arrives one piece at a time, in the order it arrives. */
  readonly stream: readonly StreamItem[];
  /**
   * The item whose loss the readout calls out by name. Every preset needs one:
   * "three turns were dropped" is a statistic, and "the budget is gone" is the
   * lesson.
   */
  readonly keyFact: ItemId;
  /** Where the reader starts — comfortably inside the window, never at the edge. */
  readonly defaultStage: number;
}

/**
 * A plain conversation, planning four days away.
 *
 * The sizes are doing pedagogical work. Turn one carries the one constraint the
 * whole conversation depends on and is the smallest thing in the stream, so
 * drop-the-oldest evicts it first and cheapest. Turn seven is a pasted email
 * four hundred and eighty tokens long, which on its own is enough to empty the
 * window around it — the single most common way a real conversation falls over.
 */
const CHAT: Preset = {
  id: 'chat',
  capacity: 1000,
  instructionTokens: 90,
  replyTokens: 300,
  keyFact: 'chat-brief',
  defaultStage: 3,
  stream: [
    { id: 'chat-brief', kind: 'you', tokens: 55 },
    { id: 'chat-plan', kind: 'it', tokens: 170 },
    { id: 'chat-hills', kind: 'you', tokens: 40 },
    { id: 'chat-replan', kind: 'it', tokens: 195 },
    { id: 'chat-day-two', kind: 'you', tokens: 30 },
    { id: 'chat-day-two-answer', kind: 'it', tokens: 250 },
    { id: 'chat-booking', kind: 'you', tokens: 480 },
    { id: 'chat-booking-answer', kind: 'it', tokens: 225 },
    { id: 'chat-afford', kind: 'you', tokens: 35 },
  ],
};

/**
 * The same window, filled the way a document-answering system fills it: a long
 * standing instruction, a short history, the question, and five fetched pages
 * of which one actually answers it.
 *
 * Built for `context-engineering` rather than for this unit. The question is
 * pinned because dropping the thing being asked is not a trade anybody makes,
 * and the page that answers it is the `keyFact`, so the readout says plainly
 * when a strategy has just thrown it away.
 */
const RETRIEVAL: Preset = {
  id: 'retrieval',
  capacity: 2000,
  instructionTokens: 220,
  replyTokens: 500,
  keyFact: 'rag-returns',
  defaultStage: 5,
  stream: [
    { id: 'rag-earlier-question', kind: 'you', tokens: 40 },
    { id: 'rag-earlier-answer', kind: 'it', tokens: 150 },
    { id: 'rag-question', kind: 'you', tokens: 45, pinned: true },
    { id: 'rag-returns', kind: 'document', tokens: 320 },
    { id: 'rag-shipping', kind: 'document', tokens: 280 },
    { id: 'rag-old-returns', kind: 'document', tokens: 350 },
    { id: 'rag-warranty', kind: 'document', tokens: 260 },
    { id: 'rag-thread', kind: 'document', tokens: 300 },
  ],
};

export const PRESETS: Record<PresetId, Preset> = {
  chat: CHAT,
  retrieval: RETRIEVAL,
};

export const PRESET_IDS: readonly PresetId[] = ['chat', 'retrieval'];

/** This unit's board. A bare `<ContextBudget />` is the plain conversation. */
export const DEFAULT_PRESET: PresetId = 'chat';

/** What gets thrown out when the conversation no longer fits. */
export type Strategy = 'oldest' | 'biggest' | 'summarise';

export const STRATEGIES: readonly Strategy[] = [
  'oldest',
  'biggest',
  'summarise',
];

/** What almost every system does when nobody has chosen anything. */
export const DEFAULT_STRATEGY: Strategy = 'oldest';

/**
 * How much of the replaced stretch a stand-in summary costs.
 *
 * An eighth is a plausible middle: short enough to buy real room, long enough
 * that a reader does not mistake it for free. The exact figure matters less
 * than the shape — a summary is a fraction, so it is a fraction of the detail.
 */
export const SUMMARY_DIVISOR = 8;

export type ItemState = 'kept' | 'pinned' | 'dropped' | 'summarised';

export interface PlacedItem {
  readonly item: StreamItem;
  readonly state: ItemState;
  /**
   * Where this item starts, in tokens from the left edge of the whole window —
   * so it already includes the instructions and any summary sitting in front of
   * it. Zero for anything not in the window.
   */
  readonly start: number;
}

export interface WindowState {
  readonly capacity: number;
  readonly instructionTokens: number;
  readonly replyTokens: number;
  /** What is left for the conversation once instructions and reply are set aside. */
  readonly room: number;

  /** Every item in play, in the order it arrived. */
  readonly items: readonly PlacedItem[];

  /** What the stand-in summary costs, or zero when nothing was summarised. */
  readonly summaryTokens: number;
  /** What that summary stands in for, in tokens. */
  readonly summarisedTokens: number;

  /** The conversation as it now sits in the window, summary included. */
  readonly conversationTokens: number;
  /** What the conversation would have cost with nothing thrown away. */
  readonly wantedTokens: number;

  /** Instructions plus conversation: what the model actually reads this turn. */
  readonly read: number;
  /** Read, plus the room held back for the reply. Never above capacity. */
  readonly used: number;
  /** Window left over. */
  readonly spare: number;

  /** True once something had to go. */
  readonly overflowed: boolean;
  /** Where the preset's one load-bearing item ended up. */
  readonly keyFactState: ItemState | 'unsaid';
}

const tokensOf = (items: readonly StreamItem[]): number =>
  items.reduce((total, item) => total + item.tokens, 0);

/** Stages run from one message to the whole stream. Zero teaches nothing. */
export function clampStage(preset: Preset, stage: number): number {
  return Math.min(preset.stream.length, Math.max(1, Math.round(stage)));
}

/**
 * The indices anything is allowed to evict: everything except the newest item
 * and anything the preset pinned by hand.
 */
function droppableIndices(items: readonly StreamItem[]): number[] {
  const newest = items.length - 1;
  const indices: number[] = [];

  for (let index = 0; index < items.length; index += 1) {
    if (index === newest) continue;
    if (items[index].pinned === true) continue;
    indices.push(index);
  }

  return indices;
}

/** Throws items away in the given order, and stops the moment it fits. */
function dropUntilItFits(
  items: readonly StreamItem[],
  room: number,
  order: readonly number[],
): Set<number> {
  const removed = new Set<number>();
  let total = tokensOf(items);

  for (const index of order) {
    if (total <= room) break;
    removed.add(index);
    total -= items[index].tokens;
  }

  return removed;
}

/**
 * Replaces a growing stretch of the oldest items with one summary, and stops at
 * the shortest stretch that fits.
 *
 * The summary is charged for. That is the honest part: a summary is not a way
 * of keeping something for free, it is a smaller thing standing where a bigger
 * one used to be, and it still occupies the window.
 */
function summariseUntilItFits(
  items: readonly StreamItem[],
  room: number,
  order: readonly number[],
): { taken: Set<number>; summaryTokens: number; summarisedTokens: number } {
  const taken = new Set<number>();
  const total = tokensOf(items);

  let summarisedTokens = 0;
  let summaryTokens = 0;

  for (const index of order) {
    taken.add(index);
    summarisedTokens += items[index].tokens;
    summaryTokens = Math.ceil(summarisedTokens / SUMMARY_DIVISOR);

    if (total - summarisedTokens + summaryTokens <= room) break;
  }

  return { taken, summaryTokens, summarisedTokens };
}

/**
 * What is in the window after this many pieces have arrived, under this rule
 * for what to throw away.
 */
export function windowAt(
  preset: Preset,
  stage: number,
  strategy: Strategy,
): WindowState {
  const items = preset.stream.slice(0, clampStage(preset, stage));
  const room = preset.capacity - preset.instructionTokens - preset.replyTokens;
  const wantedTokens = tokensOf(items);

  let removed = new Set<number>();
  let summarised = new Set<number>();
  let summaryTokens = 0;
  let summarisedTokens = 0;

  if (wantedTokens > room) {
    const droppable = droppableIndices(items);

    if (strategy === 'summarise') {
      const outcome = summariseUntilItFits(items, room, droppable);
      summarised = outcome.taken;
      summaryTokens = outcome.summaryTokens;
      summarisedTokens = outcome.summarisedTokens;
    } else {
      // Ties broken by arrival order, so the same setting always throws away
      // the same message.
      const order =
        strategy === 'oldest'
          ? droppable
          : [...droppable].sort(
              (left, right) =>
                items[right].tokens - items[left].tokens || left - right,
            );

      removed = dropUntilItFits(items, room, order);
    }
  }

  const newest = items.length - 1;
  let cursor = preset.instructionTokens + summaryTokens;

  const placed: PlacedItem[] = items.map((item, index) => {
    if (summarised.has(index)) {
      return { item, state: 'summarised', start: 0 };
    }

    if (removed.has(index)) {
      return { item, state: 'dropped', start: 0 };
    }

    const start = cursor;
    cursor += item.tokens;

    const pinned = item.pinned === true || index === newest;
    return { item, state: pinned ? 'pinned' : 'kept', start };
  });

  const conversationTokens =
    summaryTokens +
    tokensOf(
      placed
        .filter(({ state }) => state === 'kept' || state === 'pinned')
        .map(({ item }) => item),
    );

  const read = preset.instructionTokens + conversationTokens;
  const used = read + preset.replyTokens;

  const keyFact = placed.find(({ item }) => item.id === preset.keyFact);

  return {
    capacity: preset.capacity,
    instructionTokens: preset.instructionTokens,
    replyTokens: preset.replyTokens,
    room,
    items: placed,
    summaryTokens,
    summarisedTokens,
    conversationTokens,
    wantedTokens,
    read,
    used,
    spare: preset.capacity - used,
    overflowed: wantedTokens > room,
    keyFactState: keyFact ? keyFact.state : 'unsaid',
  };
}

/**
 * Every token the model has read to get this far — the whole window, once per
 * turn, all the way back to the first message.
 *
 * This is the number the unit is actually about. Nothing is remembered, so
 * nothing is read once.
 */
export function readSoFar(
  preset: Preset,
  stage: number,
  strategy: Strategy,
): number {
  const top = clampStage(preset, stage);
  let total = 0;

  for (let turn = 1; turn <= top; turn += 1) {
    total += windowAt(preset, turn, strategy).read;
  }

  return total;
}

/** Everything the reader themselves has put in, which is the comparison. */
export function typedSoFar(preset: Preset, stage: number): number {
  return tokensOf(
    preset.stream
      .slice(0, clampStage(preset, stage))
      .filter((item) => item.kind === 'you'),
  );
}
