import { describe, expect, it } from 'vitest';

import { isExternal, joinBase } from './paths';

const DEPLOY_BASE = '/how-ai-works/';

describe('joinBase', () => {
  it('prefixes an internal path with the deployment base', () => {
    expect(joinBase(DEPLOY_BASE, '/units/tokenization')).toBe(
      '/how-ai-works/units/tokenization',
    );
  });

  it('accepts paths without a leading slash', () => {
    expect(joinBase(DEPLOY_BASE, 'units/tokenization')).toBe(
      '/how-ai-works/units/tokenization',
    );
  });

  it('never produces a doubled slash at the join', () => {
    expect(joinBase('/how-ai-works', '/map')).toBe('/how-ai-works/map');
    expect(joinBase('/how-ai-works/', '/map')).toBe('/how-ai-works/map');
  });

  it('keeps the site root addressable', () => {
    expect(joinBase(DEPLOY_BASE, '/')).toBe('/how-ai-works/');
  });

  it('works when deployed at the domain root', () => {
    expect(joinBase('/', '/map')).toBe('/map');
    expect(joinBase('/', '/')).toBe('/');
  });

  it('leaves absolute URLs untouched', () => {
    expect(joinBase(DEPLOY_BASE, 'https://astro.build')).toBe(
      'https://astro.build',
    );
    expect(joinBase(DEPLOY_BASE, 'http://example.com/x')).toBe(
      'http://example.com/x',
    );
  });

  it('leaves protocol-relative URLs untouched', () => {
    expect(joinBase(DEPLOY_BASE, '//cdn.example.com/a.js')).toBe(
      '//cdn.example.com/a.js',
    );
  });

  it('leaves fragments, queries, and non-http schemes untouched', () => {
    expect(joinBase(DEPLOY_BASE, '#checkpoint')).toBe('#checkpoint');
    expect(joinBase(DEPLOY_BASE, '?q=embeddings')).toBe('?q=embeddings');
    expect(joinBase(DEPLOY_BASE, 'mailto:hi@example.com')).toBe(
      'mailto:hi@example.com',
    );
  });

  it('preserves trailing slashes on directory-style paths', () => {
    expect(joinBase(DEPLOY_BASE, '/units/')).toBe('/how-ai-works/units/');
  });
});

describe('isExternal', () => {
  it.each([
    'https://example.com',
    '//example.com',
    '#anchor',
    'mailto:a@b.co',
    'tel:+100',
  ])('treats %s as external', (href) => {
    expect(isExternal(href)).toBe(true);
  });

  it.each(['/units', 'units', '/'])('treats %s as internal', (href) => {
    expect(isExternal(href)).toBe(false);
  });
});
