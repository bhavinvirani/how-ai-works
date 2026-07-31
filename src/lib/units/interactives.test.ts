import { describe, expect, it } from 'vitest';

import { assertInteractivesExist, INTERACTIVE_NAMES } from './interactives';

const known = new Set(['SpamRuleWriter', 'DialTuner']);

describe('assertInteractivesExist', () => {
  it('accepts a unit naming a real instrument', () => {
    expect(() => {
      assertInteractivesExist(
        [{ id: 'why-rules-fail', interactives: ['SpamRuleWriter'] }],
        known,
      );
    }).not.toThrow();
  });

  it('accepts a unit with no instruments', () => {
    expect(() => {
      assertInteractivesExist([{ id: 'some-unit', interactives: [] }], known);
    }).not.toThrow();
  });

  it('rejects a typo, and names both the unit and the component', () => {
    expect(() => {
      assertInteractivesExist(
        [{ id: 'why-rules-fail', interactives: ['SpamRuleWritter'] }],
        known,
      );
    }).toThrow(/why-rules-fail.*SpamRuleWritter/s);
  });

  it('reports every problem at once rather than only the first', () => {
    let message = '';
    try {
      assertInteractivesExist(
        [
          { id: 'a', interactives: ['Nope'] },
          { id: 'b', interactives: ['AlsoNope'] },
        ],
        known,
      );
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toContain('Nope');
    expect(message).toContain('AlsoNope');
  });
});

describe('INTERACTIVE_NAMES', () => {
  it('is discovered from the filesystem rather than hand-maintained', () => {
    // If this ever empties out, the gate above silently accepts everything.
    expect(INTERACTIVE_NAMES.size).toBeGreaterThan(0);
    expect(INTERACTIVE_NAMES.has('SpamRuleWriter')).toBe(true);
  });
});
