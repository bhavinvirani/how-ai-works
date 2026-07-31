import { describe, expect, it } from 'vitest';

import { resolveConnections, resolvePrerequisites, unitHref } from './resolve';

const BASE = '/how-ai-works';

describe('unitHref', () => {
  it('builds a base-aware unit path', () => {
    expect(unitHref(BASE, 'tokenization')).toBe(
      '/how-ai-works/units/tokenization',
    );
  });

  it('works when deployed at the domain root', () => {
    expect(unitHref('/', 'tokenization')).toBe('/units/tokenization');
  });
});

describe('resolveConnections', () => {
  const titles: Record<string, string> = { embeddings: 'Embeddings' };
  const titleOf = (id: string) => titles[id];

  it('turns a reference into link data', () => {
    const resolved = resolveConnections(
      [{ to: { id: 'embeddings' }, why: 'Tokens feed embeddings.' }],
      titleOf,
      BASE,
    );

    expect(resolved).toEqual([
      {
        id: 'embeddings',
        href: '/how-ai-works/units/embeddings',
        title: 'Embeddings',
        why: 'Tokens feed embeddings.',
      },
    ]);
  });

  it('drops references that resolve to nothing rather than throwing', () => {
    // Zod already fails the build on a dangling reference, so anything missing
    // here was filtered out downstream — not worth taking a page down over.
    const resolved = resolveConnections(
      [{ to: { id: 'ghost' }, why: 'nope' }],
      titleOf,
      BASE,
    );

    expect(resolved).toEqual([]);
  });

  it('keeps the resolvable ones when only some are missing', () => {
    const resolved = resolveConnections(
      [
        { to: { id: 'ghost' }, why: 'nope' },
        { to: { id: 'embeddings' }, why: 'yes' },
      ],
      titleOf,
      BASE,
    );

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe('embeddings');
  });

  it('handles an empty list', () => {
    expect(resolveConnections([], titleOf, BASE)).toEqual([]);
  });
});

describe('resolvePrerequisites', () => {
  const describeUnit = (id: string) =>
    id === 'tokenization'
      ? { title: 'Tokenization', summary: 'How text becomes numbers.' }
      : undefined;

  it('uses the unit summary as the reason', () => {
    // Prerequisites carry no per-link `why`, so the summary explains the link.
    const resolved = resolvePrerequisites(
      [{ id: 'tokenization' }],
      describeUnit,
      BASE,
    );

    expect(resolved).toEqual([
      {
        id: 'tokenization',
        href: '/how-ai-works/units/tokenization',
        title: 'Tokenization',
        why: 'How text becomes numbers.',
      },
    ]);
  });

  it('drops unresolvable prerequisites', () => {
    expect(resolvePrerequisites([{ id: 'ghost' }], describeUnit, BASE)).toEqual(
      [],
    );
  });
});
