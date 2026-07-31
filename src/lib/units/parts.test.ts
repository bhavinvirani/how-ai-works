import { describe, expect, it } from 'vitest';

import { PART_LABELS, PARTS } from './parts';

/**
 * The Part list is a closed enum in the content schema and a grouping key on
 * `/progress` and `/map`. `Record<Part, string>` already forces every Part to
 * carry a label at compile time, so these cover only what the type system
 * cannot see: the shape of the slugs themselves.
 */
describe('PARTS', () => {
  // Must match ID_PATTERN in scripts/new-unit.mjs, which validates the Part
  // argument against this same list.
  const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  it('are all legal kebab-case ids', () => {
    const illegal = PARTS.filter((part) => !ID_PATTERN.test(part));
    expect(illegal).toEqual([]);
  });

  it('are unique', () => {
    expect(new Set(PARTS).size).toBe(PARTS.length);
  });

  it('every label is a real name rather than a placeholder', () => {
    const empty = PARTS.filter((part) => PART_LABELS[part].trim() === '');
    expect(empty).toEqual([]);
  });

  it('no label is duplicated — two Parts reading the same in a sidebar is a bug', () => {
    const labels = PARTS.map((part) => PART_LABELS[part]);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
