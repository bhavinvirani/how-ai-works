import { describe, expect, it } from 'vitest';

import {
  CLAIM_TEXT,
  ENDING_TEXT,
  METER_RESULT_TEXT,
  RESULT_LABEL,
  TOOL_TEXT,
  TURN_TEXT,
} from './data.en';
import {
  BRANCH_INDEX,
  BRANCH_TURN,
  branchReached,
  claimHolds,
  clampTurns,
  contextAfter,
  contextAt,
  CONTEXT_BEFORE_FIRST,
  contextNow,
  contextPercent,
  DEFAULT_RESULT,
  DEFAULT_TURNS,
  endingClaims,
  endingKind,
  HELD_TOOLS,
  isFinished,
  isHeld,
  readingMultiple,
  RESULT_IDS,
  runFor,
  SHARED_TURNS,
  stepsIn,
  TOOL_IDS,
  totalRead,
  turnsShown,
  unsupportedClaims,
} from './logic';
import type { ResultId } from './logic';

const idsOf = (result: ResultId) => runFor(result).map((turn) => turn.id);

describe('the three runs', () => {
  it('offers three results and starts on one of them', () => {
    expect(RESULT_IDS).toHaveLength(3);
    expect(RESULT_IDS).toContain(DEFAULT_RESULT);
    expect(DEFAULT_TURNS).toBe(1);
  });

  it('never takes the same turn twice within a run', () => {
    for (const result of RESULT_IDS) {
      expect(new Set(idsOf(result)).size).toBe(stepsIn(result));
    }
  });

  it('only ever asks for a tool it was given', () => {
    const tools = new Set(TOOL_IDS);

    for (const result of RESULT_IDS) {
      for (const turn of runFor(result)) {
        if (turn.tool !== null) expect(tools.has(turn.tool)).toBe(true);
      }
    }
  });

  it('only ever rests a statement on a turn that run actually took', () => {
    for (const result of RESULT_IDS) {
      const taken = new Set(idsOf(result));

      for (const claim of endingClaims(result)) {
        expect(claim.restsOn.length).toBeGreaterThan(0);
        for (const turn of claim.restsOn) expect(taken.has(turn)).toBe(true);
      }
    }
  });

  it('makes statements only on the last turn of a run', () => {
    for (const result of RESULT_IDS) {
      const run = runFor(result);

      run.slice(0, -1).forEach((turn) => {
        expect(turn.claims).toEqual([]);
      });
      expect(endingClaims(result).length).toBeGreaterThan(0);
    }
  });

  it('has a line of English for every id in every list', () => {
    for (const tool of TOOL_IDS) {
      expect(TOOL_TEXT[tool].name.length).toBeGreaterThan(0);
      expect(TOOL_TEXT[tool].does.length).toBeGreaterThan(0);
    }

    for (const result of RESULT_IDS) {
      expect(RESULT_LABEL[result].length).toBeGreaterThan(0);
      expect(METER_RESULT_TEXT[result].length).toBeGreaterThan(0);
      expect(ENDING_TEXT[result].lead.length).toBeGreaterThan(0);
      expect(ENDING_TEXT[result].note.length).toBeGreaterThan(0);

      for (const turn of runFor(result)) {
        expect(TURN_TEXT[turn.id].intent.length).toBeGreaterThan(0);
        // An empty action is a turn that asked for no tool. An empty result is
        // either the branch turn, whose result the reader supplies, or a turn
        // that asked for nothing and so had nothing come back.
        expect(TURN_TEXT[turn.id].action === '').toBe(turn.tool === null);
        expect(TURN_TEXT[turn.id].result === '').toBe(
          turn.id === BRANCH_TURN || turn.tool === null,
        );
      }

      for (const claim of endingClaims(result)) {
        expect(CLAIM_TEXT[claim.id].length).toBeGreaterThan(0);
      }
    }
  });
});

describe('clampTurns', () => {
  it('never shows fewer than one turn', () => {
    expect(clampTurns('flat', 0)).toBe(1);
    expect(clampTurns('flat', -9)).toBe(1);
  });

  it('never shows more turns than the run has', () => {
    for (const result of RESULT_IDS) {
      expect(clampTurns(result, 99)).toBe(stepsIn(result));
    }
  });

  it('pulls a reader back when they switch to a shorter run', () => {
    // Six turns into `flat`, then over to `missing`, which only has four.
    expect(clampTurns('flat', 6)).toBe(6);
    expect(clampTurns('missing', 6)).toBe(stepsIn('missing'));
  });

  it('takes whole turns only', () => {
    expect(clampTurns('flat', 2.4)).toBe(2);
    expect(clampTurns('flat', 2.6)).toBe(3);
  });
});

describe('turnsShown, branchReached and isFinished', () => {
  it('shows the run from the beginning, as far as the setting says', () => {
    expect(turnsShown('flat', 3).map((turn) => turn.id)).toEqual(
      idsOf('flat').slice(0, 3),
    );
  });

  it('reports the branch as unreached until the turn it sits on', () => {
    expect(branchReached('flat', BRANCH_INDEX)).toBe(false);
    expect(branchReached('flat', SHARED_TURNS)).toBe(true);
  });

  it('reports a run finished only on its own last turn', () => {
    for (const result of RESULT_IDS) {
      expect(isFinished(result, stepsIn(result) - 1)).toBe(false);
      expect(isFinished(result, stepsIn(result))).toBe(true);
    }
  });
});

describe('what each turn has to read', () => {
  it('starts every run with the goal and the tool descriptions', () => {
    for (const result of RESULT_IDS) {
      expect(contextAt(result, 0)).toBe(CONTEXT_BEFORE_FIRST);
    }
  });

  it('never goes down, because nothing is ever taken out', () => {
    for (const result of RESULT_IDS) {
      for (let turn = 1; turn < stepsIn(result); turn += 1) {
        expect(contextAt(result, turn)).toBeGreaterThan(
          contextAt(result, turn - 1),
        );
      }
    }
  });

  it('ignores a turn index off either end', () => {
    expect(contextAt('flat', -4)).toBe(CONTEXT_BEFORE_FIRST);
    expect(contextAt('flat', 99)).toBe(contextAfter('flat'));
  });

  it('reports the turn on screen, not the one after it', () => {
    expect(contextNow('flat', 1)).toBe(contextAt('flat', 0));
    expect(contextNow('flat', 4)).toBe(contextAt('flat', 3));
  });

  it('fills the bar on the last turn of every run', () => {
    for (const result of RESULT_IDS) {
      expect(contextPercent(result, stepsIn(result) - 1)).toBe(100);
      expect(contextPercent(result, 0)).toBeLessThan(100);
    }
  });
});

describe('how a run ends', () => {
  it('calls a turn that asked for no tool an answer', () => {
    expect(endingKind('doubled')).toBe('answered');
  });

  it('calls a turn your code would not run a stop for a person', () => {
    expect(endingKind('flat')).toBe('held');
  });

  it('calls a turn that ran and changed something an action', () => {
    expect(endingKind('missing')).toBe('acted');
  });

  it('knows which tools are held', () => {
    expect(isHeld('switch')).toBe(true);
    expect(isHeld('email')).toBe(false);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim the page makes about this instrument is checked here, so that
 * editing a turn — adding one, moving the branch, changing what a result costs
 * — fails the build instead of quietly turning the surrounding paragraphs into
 * fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('opens identically whichever result comes back', () => {
    // Two turns before anything can depend on anything: the same intent, the
    // same tool, the same call. This is the control in the experiment.
    expect(SHARED_TURNS).toBe(2);
    expect(BRANCH_INDEX).toBe(1);

    const shared = RESULT_IDS.map((result) =>
      idsOf(result).slice(0, SHARED_TURNS),
    );

    for (const prefix of shared) expect(prefix).toEqual(shared[0]);
    expect(shared[0]).toEqual(['open', BRANCH_TURN]);
  });

  it('changes nothing about that second turn except what came back', () => {
    const meters = RESULT_IDS.map((result) => runFor(result)[BRANCH_INDEX]);

    for (const meter of meters) {
      expect(meter.id).toBe(BRANCH_TURN);
      expect(meter.tool).toBe('readings');
    }

    // And one of the three came back with nothing in it.
    expect(meters.filter((meter) => !meter.evidence)).toHaveLength(1);
    expect(runFor('missing')[BRANCH_INDEX].evidence).toBe(false);
  });

  it('shares not one turn between any two runs after that', () => {
    // The unit: "one result, changed, does not adjust the plan — it replaces
    // it." Nothing after the branch is taken by more than one run.
    const after = RESULT_IDS.map((result) => idsOf(result).slice(SHARED_TURNS));
    const all = after.flat();

    expect(new Set(all).size).toBe(all.length);
  });

  it('does not even agree on how long the job is', () => {
    expect(stepsIn('doubled')).toBe(5);
    expect(stepsIn('flat')).toBe(6);
    expect(stepsIn('missing')).toBe(4);

    const lengths = RESULT_IDS.map(stepsIn);
    expect(new Set(lengths).size).toBe(lengths.length);
  });

  it('finishes three different ways', () => {
    const endings = RESULT_IDS.map(endingKind);

    expect(endings).toEqual(['answered', 'held', 'acted']);
    expect(new Set(endings).size).toBe(3);
  });

  it('stops for a person because of a list you wrote, not a judgement it made', () => {
    // The one run that stops does so in front of a reversible tariff change.
    // The one run that does something irreversible meets no gate at all,
    // because `email` is not on the list and nothing in the model knows that
    // it should have been.
    expect(HELD_TOOLS).toEqual(['switch']);

    const held = runFor('flat')[stepsIn('flat') - 1];
    const acted = runFor('missing')[stepsIn('missing') - 1];

    expect(held.tool).toBe('switch');
    expect(acted.tool).toBe('email');
    expect(isHeld('email')).toBe(false);
  });

  it('reaches a conclusion resting on nothing only where the result came back empty', () => {
    expect(unsupportedClaims('doubled')).toEqual([]);
    expect(unsupportedClaims('flat')).toEqual([]);

    const floating = unsupportedClaims('missing');
    expect(floating).toHaveLength(2);
    expect(floating.map((claim) => claim.id)).toEqual([
      'c-april',
      'c-estimate',
    ]);
  });

  it('makes the same kind of statement sound in two runs and fabricated in the third', () => {
    // Every run finishes with a statement resting on the meter. In two of them
    // the meter returned two numbers; in the third it returned a sentence
    // saying there were none. Nothing in the writing separates those.
    const restingOnMeter = (result: ResultId) =>
      endingClaims(result).filter((claim) =>
        claim.restsOn.includes(BRANCH_TURN),
      );

    for (const result of RESULT_IDS) {
      expect(restingOnMeter(result).length).toBeGreaterThan(0);
    }

    expect(
      restingOnMeter('doubled').every((claim) => claimHolds('doubled', claim)),
    ).toBe(true);
    expect(
      restingOnMeter('flat').every((claim) => claimHolds('flat', claim)),
    ).toBe(true);
    expect(
      restingOnMeter('missing').some((claim) => claimHolds('missing', claim)),
    ).toBe(false);
  });

  it('sends the unsupported statement out of the building', () => {
    // The difference between a fabricated sentence and a fabricated action.
    // Both statements resting on nothing are in the letter that was sent.
    expect(endingKind('missing')).toBe('acted');
    expect(CLAIM_TEXT['c-estimate']).toContain('far too high');
    expect(unsupportedClaims('missing').map((claim) => claim.id)).toContain(
      'c-estimate',
    );
  });

  it('quotes the token counts the unit writes on the page', () => {
    // The unit: "320 tokens on the first turn, 875 on the sixth, and 1,005
    // sitting in the context when it stops."
    expect(CONTEXT_BEFORE_FIRST).toBe(320);
    expect(contextAt('flat', 0)).toBe(320);
    expect(contextAt('flat', 5)).toBe(875);
    expect(contextAfter('flat')).toBe(1005);
  });

  it('costs eleven times what the same goal asked once would have', () => {
    // The unit: "3,580 tokens read across the whole run — eleven times what
    // this goal would have cost as a single question."
    expect(totalRead('flat')).toBe(3580);
    expect(readingMultiple('flat')).toBe(11);

    // And the shortest run is still more than five times a single question,
    // which is the honest version of "agents are expensive": it is not the
    // length of the answer, it is the re-reading.
    expect(readingMultiple('missing')).toBe(5);
  });
});
