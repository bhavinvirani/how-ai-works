import { describe, expect, it } from 'vitest';

import {
  clampRoom,
  costMultiple,
  MAX_ROOM,
  MIN_ROOM,
  QUESTION_IDS,
  QUESTIONS,
  ROOM_SETTINGS,
  ROOM_STEP,
  runAt,
  settlesAt,
  verdictTurnsAt,
} from './logic';

describe('the four questions', () => {
  it('offers every question the panel knows about', () => {
    expect([...QUESTION_IDS].sort()).toEqual(Object.keys(QUESTIONS).sort());
  });

  it('always has something to say, even with no working at all', () => {
    for (const id of QUESTION_IDS) {
      expect(QUESTIONS[id].outcomes[0].fromStep).toBe(0);
    }
  });

  it('reaches every outcome it defines from somewhere on the slider', () => {
    for (const id of QUESTION_IDS) {
      const reached = new Set(
        ROOM_SETTINGS.map((room) => runAt(id, room).answer.id),
      );

      for (const outcome of QUESTIONS[id].outcomes) {
        expect(reached.has(outcome.id)).toBe(true);
      }
    }
  });

  it('keeps its outcomes in the order the working unfolds', () => {
    for (const id of QUESTION_IDS) {
      const steps = QUESTIONS[id].outcomes.map((outcome) => outcome.fromStep);

      expect([...steps].sort((left, right) => left - right)).toEqual(steps);
    }
  });

  it('never needs more working than it has lines to write', () => {
    for (const id of QUESTION_IDS) {
      const question = QUESTIONS[id];
      const deepest = question.outcomes[question.outcomes.length - 1].fromStep;

      expect(deepest).toBeLessThanOrEqual(question.working.length);
    }
  });
});

describe('clampRoom', () => {
  it('refuses a negative budget', () => {
    expect(clampRoom(-40)).toBe(MIN_ROOM);
  });

  it('refuses more room than the slider offers', () => {
    expect(clampRoom(9000)).toBe(MAX_ROOM);
  });

  it('snaps to the settings the slider can actually reach', () => {
    expect(clampRoom(44)).toBe(40);
    expect(clampRoom(46)).toBe(50);
  });

  it('leaves every real setting where it is', () => {
    for (const room of ROOM_SETTINGS) {
      expect(clampRoom(room)).toBe(room);
    }
  });
});

describe('runAt', () => {
  it('writes a prefix of the working and never skips ahead', () => {
    for (const id of QUESTION_IDS) {
      for (const room of ROOM_SETTINGS) {
        const { lines } = runAt(id, room);
        const firstUnwritten = lines.findIndex((line) => !line.written);

        if (firstUnwritten !== -1) {
          for (const line of lines.slice(firstUnwritten)) {
            expect(line.written).toBe(false);
          }
        }
      }
    }
  });

  it('never writes a line it cannot pay for in full', () => {
    for (const id of QUESTION_IDS) {
      for (const room of ROOM_SETTINGS) {
        const run = runAt(id, room);

        expect(run.workingTokens).toBeLessThanOrEqual(run.room);

        for (const line of run.lines) {
          if (line.written) expect(line.endsAt).toBeLessThanOrEqual(run.room);
        }
      }
    }
  });

  it('accounts for every token of room exactly once', () => {
    for (const id of QUESTION_IDS) {
      for (const room of ROOM_SETTINGS) {
        const run = runAt(id, room);

        expect(run.workingTokens + run.spare).toBe(run.room);
        expect(run.written + run.unwritten).toBe(run.lines.length);
      }
    }
  });

  it('ignores a setting off either end of the slider', () => {
    expect(runAt('rice', -10).passes).toBe(runAt('rice', MIN_ROOM).passes);
    expect(runAt('rice', 500).passes).toBe(runAt('rice', MAX_ROOM).passes);
  });

  it('is deterministic — the same setting always writes the same thing', () => {
    expect(runAt('polite', 50).answer.id).toBe(runAt('polite', 50).answer.id);
    expect(runAt('polite', 50).passes).toBe(runAt('polite', 50).passes);
  });
});

describe('verdictTurnsAt and settlesAt', () => {
  it('finds no turning point where the verdict never turns', () => {
    expect(verdictTurnsAt('capital')).toBeNull();
  });

  it('names a setting on the slider when the verdict does turn', () => {
    for (const id of ['rice', 'polite', 'supplier'] as const) {
      const turn = verdictTurnsAt(id);

      expect(turn).not.toBeNull();
      expect(ROOM_SETTINGS).toContain(turn);
    }
  });

  it('settles at a setting where nothing further ever changes', () => {
    for (const id of QUESTION_IDS) {
      const settled = settlesAt(id);
      const reference = runAt(id, MAX_ROOM);

      for (const room of ROOM_SETTINGS.filter((value) => value >= settled)) {
        const run = runAt(id, room);

        expect(run.answer.id).toBe(reference.answer.id);
        expect(run.written).toBe(reference.written);
      }
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number `reasoning-models.mdx` quotes about this panel is checked here,
 * so a later edit to a token cost fails the build instead of quietly turning
 * the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('charges one pass per token produced, working and answer alike', () => {
    for (const id of QUESTION_IDS) {
      for (const room of ROOM_SETTINGS) {
        const run = runAt(id, room);

        expect(run.passes).toBe(run.workingTokens + run.answer.tokens);
      }
    }
  });

  it('never gets cheaper as the room grows, on any question', () => {
    for (const id of QUESTION_IDS) {
      for (let index = 1; index < ROOM_SETTINGS.length; index += 1) {
        expect(runAt(id, ROOM_SETTINGS[index]).passes).toBeGreaterThanOrEqual(
          runAt(id, ROOM_SETTINGS[index - 1]).passes,
        );
      }
    }
  });

  it('turns the puzzle from wrong to right, and only at fifty', () => {
    // "Ten passes to be wrong. Sixty-three to be right."
    expect(runAt('rice', 0).answer.good).toBe(false);
    expect(runAt('rice', 0).passes).toBe(10);

    expect(runAt('rice', 40).answer.good).toBe(false);
    expect(runAt('rice', 50).answer.good).toBe(true);
    expect(runAt('rice', 50).passes).toBe(63);

    expect(verdictTurnsAt('rice')).toBe(50);
  });

  it('leaves the right quantity and the wrong conclusion in between', () => {
    // Half the working is a different wrong answer, not half an answer.
    const partial = runAt('rice', 30);

    expect(partial.written).toBe(2);
    expect(partial.answer.id).toBe('rice-partial');
    expect(partial.answer.good).toBe(false);
    expect(partial.answer.id).not.toBe(runAt('rice', 0).answer.id);
  });

  it('leaves the comparison sitting there unwritten at forty', () => {
    // The line that would have caught the mistake is on the page, unwritten.
    const stopped = runAt('rice', 40);
    const compare = stopped.lines.find(
      (line) => line.step.id === 'rice-compare',
    );

    expect(compare?.written).toBe(false);
    expect(stopped.unwritten).toBe(2);
  });

  it('changes nothing at all about the lookup, at twelve times the price', () => {
    // "Three passes, or thirty-seven. The same one word either way."
    const settings = ROOM_SETTINGS.map((room) => runAt('capital', room));

    for (const run of settings) {
      expect(run.answer.id).toBe('capital-right');
      expect(run.answer.good).toBe(true);
    }

    expect(runAt('capital', 0).passes).toBe(3);
    expect(runAt('capital', MAX_ROOM).passes).toBe(37);
    expect(costMultiple('capital', MAX_ROOM)).toBeCloseTo(12.3, 1);
    expect(verdictTurnsAt('capital')).toBeNull();
  });

  it('spoils the rewrite it had already got right', () => {
    // "Eighteen passes for the good sentence. A hundred and thirteen for the
    // worse one."
    expect(runAt('polite', 0).answer.good).toBe(true);
    expect(runAt('polite', 0).passes).toBe(18);

    expect(runAt('polite', 50).answer.good).toBe(false);
    expect(runAt('polite', 50).passes).toBe(113);

    expect(runAt('polite', MAX_ROOM).answer.good).toBe(false);
  });

  it('buys a case rather than a fact when it has no facts', () => {
    // "Sixteen passes to say it cannot know. Sixty-six to sound as if it does."
    expect(runAt('supplier', 0).answer.good).toBe(true);
    expect(runAt('supplier', 0).passes).toBe(16);

    expect(runAt('supplier', 50).answer.good).toBe(false);
    expect(runAt('supplier', 50).passes).toBe(66);

    for (const room of ROOM_SETTINGS.filter((value) => value >= 50)) {
      expect(runAt('supplier', room).answer.good).toBe(false);
    }
  });

  it('lands differently on all four questions at exactly fifty', () => {
    // The single setting the unit tells the reader to step across.
    expect(runAt('rice', 50).answer.good).toBe(true);
    expect(runAt('capital', 50).answer.good).toBe(true);
    expect(runAt('polite', 50).answer.good).toBe(false);
    expect(runAt('supplier', 50).answer.good).toBe(false);

    // And the two that turn bad turn bad at that very setting, not before.
    expect(runAt('polite', 40).answer.good).toBe(true);
    expect(runAt('supplier', 40).answer.good).toBe(true);
    expect(verdictTurnsAt('polite')).toBe(50);
    expect(verdictTurnsAt('supplier')).toBe(50);
  });

  it('runs out of things to say long before the slider runs out', () => {
    // Extra room is inert on every question — the point past which more
    // thinking is not available, only more budget.
    expect(settlesAt('rice')).toBe(60);
    expect(settlesAt('capital')).toBe(40);
    expect(settlesAt('polite')).toBe(70);
    expect(settlesAt('supplier')).toBe(50);

    for (const id of QUESTION_IDS) {
      expect(settlesAt(id)).toBeLessThan(MAX_ROOM);
      expect(runAt(id, MAX_ROOM).spare).toBeGreaterThan(0);
    }
  });

  it('opens on a confident wrong answer with nothing written', () => {
    // The panel's starting state, which is the reader's problem to fix.
    const opening = runAt('rice', MIN_ROOM);

    expect(opening.written).toBe(0);
    expect(opening.workingTokens).toBe(0);
    expect(opening.answer.good).toBe(false);
    expect(ROOM_STEP).toBeGreaterThan(0);
  });
});
