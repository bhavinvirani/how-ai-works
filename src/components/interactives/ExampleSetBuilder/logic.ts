/**
 * Pure logic for ExampleSetBuilder (§3.3).
 *
 * The instrument teaches one thing: a single worked example pins the format
 * completely, and every example after it is buying something else — a piece of
 * vocabulary, a range of values, or the one thing nobody writes down, which is
 * what a request that cannot be answered looks like when it is answered
 * properly.
 *
 * THE SHAPE OF THE DATA IS THE ARGUMENT. Each held-back request carries one
 * reply per example count, from none up to the whole set, and those replies are
 * hand-authored rather than generated. That is the honest arrangement: this
 * site cannot call a model, and a fake model that produced its own outputs
 * would be a worse lie than a table that says plainly it is a table. What the
 * table is not allowed to do is drift away from the prose, and that is what
 * `logic.test.ts` is for — every claim the unit makes about this panel is
 * pinned there as arithmetic over these replies.
 *
 * Nothing here is random and nothing reads the clock. The same count and the
 * same request always produce the same prompt, the same reply and the same
 * token estimate.
 */

/** Which of the three held-back requests is being handed over next. */
export type MessageId = 'plain' | 'unusual' | 'unanswerable';

/**
 * What a downstream system could do with the reply — which is the only
 * question that matters here, and a different question from whether the reply
 * is sensible. The zero-example reply to the unanswerable request is the most
 * sensible thing on the page and still grades `unusable`.
 */
export type Grade = 'unusable' | 'wrong' | 'invented' | 'usable';

export interface Example {
  /** The message as it arrived, in somebody's own words. */
  readonly request: string;
  /** The line a person wrote for it. */
  readonly line: string;
}

export interface Reply {
  readonly text: string;
  readonly grade: Grade;
  /** What this particular reply teaches. One sentence or three, never a label. */
  readonly note: string;
}

export interface TestMessage {
  readonly id: MessageId;
  /** Short name for the control that chooses between the requests. */
  readonly label: string;
  readonly request: string;
  /**
   * One reply per example count, index 0 meaning no examples at all. A set of
   * four examples therefore needs five replies, and the test enforces it.
   */
  readonly replies: readonly Reply[];
}

/** Nobody has to use any examples, and starting there is the whole point. */
export const MIN_EXAMPLES = 0;

export function clampCount(count: number, total: number): number {
  return Math.min(total, Math.max(MIN_EXAMPLES, Math.round(count)));
}

/**
 * A rough token count, at the four-characters-to-a-token rule the tokenization
 * unit gives for ordinary English.
 *
 * Deliberately not a tokenizer. A real one would need its own vocabulary
 * shipped to the browser to move a number the reader is being asked to treat
 * as an order of magnitude, and the lesson — that the examples are re-sent and
 * re-charged on every single call — survives being ten per cent out. The unit
 * says so in as many words rather than quietly implying precision.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * The exact text that goes up the wire.
 *
 * Assembled here rather than in the view for two reasons. The token count has
 * to be a count of the thing the reader can actually see, or the cost claim is
 * theatre. And the arrangement itself is the lesson: an instruction, then a run
 * of finished pairs, then one request with nothing after it — a document whose
 * only plausible ending is another finished pair.
 */
export function promptText(
  instruction: string,
  examples: readonly Example[],
  count: number,
  message: TestMessage,
): string {
  const shown = examples.slice(0, clampCount(count, examples.length));

  return [
    instruction,
    ...shown.map((example) => `${example.request}\n${example.line}`),
    message.request,
  ].join('\n\n');
}

export function promptTokens(
  instruction: string,
  examples: readonly Example[],
  count: number,
  message: TestMessage,
): number {
  return estimateTokens(promptText(instruction, examples, count, message));
}

/** What the examples alone add to every call. Zero when there are none. */
export function exampleTokens(
  instruction: string,
  examples: readonly Example[],
  count: number,
  message: TestMessage,
): number {
  return (
    promptTokens(instruction, examples, count, message) -
    promptTokens(instruction, examples, MIN_EXAMPLES, message)
  );
}

export function replyTo(message: TestMessage, count: number): Reply {
  return message.replies[clampCount(count, message.replies.length - 1)];
}

/**
 * The smallest number of examples at which this request comes out usable and
 * stays usable however many more are added.
 *
 * Computed rather than written down, so the unit can say "the third example is
 * the one that fixes it" as a fact about the table instead of a claim the
 * reader has to take on trust. Returns -1 if no number of examples works.
 */
export function firstUsableCount(message: TestMessage): number {
  for (let count = 0; count < message.replies.length; count += 1) {
    const rest = message.replies.slice(count);

    if (rest.every((reply) => reply.grade === 'usable')) return count;
  }

  return -1;
}
