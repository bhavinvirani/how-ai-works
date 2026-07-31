import { describe, expect, it } from 'vitest';

import { EXAMPLES, INSTRUCTION, MESSAGES } from './data.en';
import {
  clampCount,
  estimateTokens,
  exampleTokens,
  firstUsableCount,
  MIN_EXAMPLES,
  promptText,
  promptTokens,
  replyTo,
} from './logic';
import type { MessageId, Reply, TestMessage } from './logic';

const find = (id: MessageId): TestMessage =>
  MESSAGES.find((message) => message.id === id) ?? MESSAGES[0];

const plain = find('plain');
const unusual = find('unusual');
const unanswerable = find('unanswerable');

/** The separator every line in this diary's format uses. */
const DOT = ' · ';

const COUNTS = Array.from({ length: EXAMPLES.length + 1 }, (_, n) => n);
const WITH_EXAMPLES = COUNTS.filter((count) => count >= 1);

const tokensAt = (count: number, message: TestMessage): number =>
  promptTokens(INSTRUCTION, EXAMPLES, count, message);

describe('the example set and the inbox', () => {
  it('gives every request a reply for every number of examples', () => {
    expect(MESSAGES).toHaveLength(3);

    for (const message of MESSAGES) {
      expect(message.replies).toHaveLength(EXAMPLES.length + 1);
    }
  });

  it('never shows the same request twice', () => {
    const requests = [
      ...EXAMPLES.map((example) => example.request),
      ...MESSAGES.map((message) => message.request),
    ];

    expect(new Set(requests).size).toBe(requests.length);
  });

  it('has each example carry one thing no earlier example had', () => {
    // 1 the format entire, 2 the second room code, 3 a half hour, 4 the
    // request that cannot be answered. The prose walks them in this order.
    expect(EXAMPLES[0].line).toContain('BACK');
    expect(EXAMPLES[0].line).not.toContain('HALL');
    expect(EXAMPLES[1].line).toContain('HALL');

    expect(EXAMPLES[0].line + EXAMPLES[1].line).not.toContain(':30');
    expect(EXAMPLES[2].line).toContain(':30');

    const early = EXAMPLES.slice(0, 3);
    expect(early.some((example) => example.line.includes('ASK'))).toBe(false);
    expect(EXAMPLES[3].line).toContain('ASK');
  });
});

describe('clampCount', () => {
  it('refuses fewer examples than none', () => {
    expect(clampCount(-3, EXAMPLES.length)).toBe(MIN_EXAMPLES);
  });

  it('refuses more examples than there are', () => {
    expect(clampCount(99, EXAMPLES.length)).toBe(EXAMPLES.length);
  });

  it('takes whole examples only', () => {
    expect(clampCount(2.4, EXAMPLES.length)).toBe(2);
    expect(clampCount(2.6, EXAMPLES.length)).toBe(3);
  });
});

describe('estimateTokens', () => {
  it('has nothing to count in nothing', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('rounds a part-token up, because part of one still gets sent', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });
});

describe('promptText', () => {
  it('always opens with the instruction and ends with the request', () => {
    for (const count of COUNTS) {
      const prompt = promptText(INSTRUCTION, EXAMPLES, count, unusual);

      expect(prompt.startsWith(INSTRUCTION)).toBe(true);
      expect(prompt.endsWith(unusual.request)).toBe(true);
    }
  });

  it('includes exactly the examples that have been added, in order', () => {
    const prompt = promptText(INSTRUCTION, EXAMPLES, 2, plain);

    expect(prompt).toContain(EXAMPLES[0].line);
    expect(prompt).toContain(EXAMPLES[1].line);
    expect(prompt).not.toContain(EXAMPLES[2].line);
    expect(prompt.indexOf(EXAMPLES[0].line)).toBeLessThan(
      prompt.indexOf(EXAMPLES[1].line),
    );
  });

  it('leaves the last request unfinished, which is the arrangement', () => {
    const lines = promptText(INSTRUCTION, EXAMPLES, 4, plain).split('\n');

    expect(lines[lines.length - 1]).toBe(plain.request);
  });

  it('is deterministic', () => {
    expect(promptText(INSTRUCTION, EXAMPLES, 3, plain)).toBe(
      promptText(INSTRUCTION, EXAMPLES, 3, plain),
    );
  });
});

describe('replyTo', () => {
  it('ignores a count off either end', () => {
    expect(replyTo(plain, -2)).toEqual(replyTo(plain, 0));
    expect(replyTo(plain, 99)).toEqual(replyTo(plain, EXAMPLES.length));
  });
});

describe('firstUsableCount', () => {
  it('reports -1 when no number of examples settles the request', () => {
    const hopeless: TestMessage = {
      ...plain,
      replies: plain.replies.map((reply): Reply => ({
        ...reply,
        grade: 'wrong',
      })),
    };

    expect(firstUsableCount(hopeless)).toBe(-1);
  });

  it('ignores a run of usable replies that does not hold to the end', () => {
    const flaky: TestMessage = {
      ...plain,
      replies: plain.replies.map((reply, index): Reply =>
        index === EXAMPLES.length ? { ...reply, grade: 'wrong' } : reply,
      ),
    };

    expect(firstUsableCount(flaky)).toBe(-1);
  });
});

/**
 * The unit's argument, pinned as arithmetic over the table rather than as
 * prose about it.
 *
 * Every claim the page makes about this panel is checked here — which example
 * fixes which request, which replies are fabrications, and what the whole set
 * costs on every call. An edit to `data.en.ts` that quietly turns a surrounding
 * paragraph into fiction fails the build instead of shipping.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('produces no format at all until an example is shown', () => {
    const openers = MESSAGES.map((message) => replyTo(message, 0));

    for (const reply of openers) {
      expect(reply.grade).toBe('unusable');
      expect(reply.text).not.toContain(DOT);
    }

    // Three requests, one instruction, three different shapes.
    expect(new Set(openers.map((reply) => reply.text)).size).toBe(3);
  });

  it('fixes the format completely on the first example, and for good', () => {
    for (const message of MESSAGES) {
      for (const count of WITH_EXAMPLES) {
        expect(replyTo(message, count).text).toContain(DOT);
      }
    }
  });

  it('leaves the format right in every reply that is nonetheless wrong', () => {
    const broken = MESSAGES.flatMap((message) =>
      WITH_EXAMPLES.map((count) => replyTo(message, count)).filter(
        (reply) => reply.grade !== 'usable',
      ),
    );

    expect(broken.length).toBeGreaterThan(0);
    for (const reply of broken) {
      expect(reply.text).toContain(DOT);
    }
  });

  it('needs one example for the plain request and is not helped by more', () => {
    expect(firstUsableCount(plain)).toBe(1);

    const settled = replyTo(plain, 1).text;
    for (const count of WITH_EXAMPLES) {
      expect(replyTo(plain, count).text).toBe(settled);
    }
  });

  it('copies the range it was shown, so the unusual request waits', () => {
    expect(firstUsableCount(unusual)).toBe(3);
    expect(replyTo(unusual, 1).grade).toBe('wrong');
    expect(replyTo(unusual, 2).grade).toBe('wrong');

    // The room code arrives with the example that contains it, and the half
    // hour with the example that contains one. Neither a step earlier.
    expect(replyTo(unusual, 1).text).not.toContain('HALL');
    expect(replyTo(unusual, 2).text).toContain('HALL');
    expect(replyTo(unusual, 2).text).not.toContain(':30');
    expect(replyTo(unusual, 3).text).toContain(':30');
  });

  it('answers the unanswerable request sensibly with nothing to copy', () => {
    const opener = replyTo(unanswerable, 0);

    expect(opener.text).toContain('?');
    expect(opener.grade).toBe('unusable');
  });

  it('starts inventing bookings the moment the format is installed', () => {
    for (const count of [1, 2, 3]) {
      expect(replyTo(unanswerable, count).grade).toBe('invented');
    }
  });

  it('reaches its worst by copying the last example out word for word', () => {
    expect(replyTo(unanswerable, 3).text).toBe(EXAMPLES[2].line);
  });

  it('is rescued only by the one example nobody would write down', () => {
    const last = EXAMPLES.length;

    expect(firstUsableCount(unanswerable)).toBe(last);
    expect(replyTo(unanswerable, last).text).toBe(EXAMPLES[last - 1].line);
    expect(replyTo(unanswerable, last - 1).grade).toBe('invented');
  });

  it('charges for the examples on every call, and roughly quadruples it', () => {
    // The unit quotes these three figures for the plain request.
    expect(tokensAt(0, plain)).toBe(26);
    expect(tokensAt(4, plain)).toBe(102);
    expect(exampleTokens(INSTRUCTION, EXAMPLES, 4, plain)).toBe(76);

    for (const message of MESSAGES) {
      expect(exampleTokens(INSTRUCTION, EXAMPLES, 0, message)).toBe(0);
      expect(tokensAt(EXAMPLES.length, message)).toBeGreaterThan(
        tokensAt(0, message) * 3,
      );

      // Every added example is paid for; none of them rides along free.
      for (const count of WITH_EXAMPLES) {
        expect(tokensAt(count, message)).toBeGreaterThan(
          tokensAt(count - 1, message),
        );
      }
    }
  });
});
