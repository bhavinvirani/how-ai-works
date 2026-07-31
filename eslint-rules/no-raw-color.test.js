import { describe, expect, it } from 'vitest';

import { findRawColor } from './no-raw-color.js';

describe('findRawColor', () => {
  it.each([
    ['#fff', '#fff'],
    ['#A81B5D', '#A81B5D'],
    ['#a81b5dff', '#a81b5dff'],
    ['  #0b6560  ', '#0b6560'],
  ])('flags the bare hex colour %s', (input, expected) => {
    expect(findRawColor(input)).toBe(expected);
  });

  it.each([
    'rgb(168, 27, 93)',
    'rgba(0,0,0,.5)',
    'hsl(340 72% 41%)',
    'oklch(0.5 0.2 350)',
  ])('flags the colour function in %s', (input) => {
    expect(findRawColor(input)).not.toBeNull();
  });

  it('flags a hex used as a CSS value', () => {
    expect(findRawColor('color: #15233b; margin: 0')).toBe('#15233b');
    expect(findRawColor('fill:#fff')).toBe('#fff');
  });

  it('flags a hex inside a Tailwind arbitrary value', () => {
    expect(findRawColor('rounded bg-[#a81b5d] p-4')).toBe('[#a81b5d]');
  });

  it.each([
    ['#checkpoint', 'a fragment link'],
    ['#where-it-fits', 'a slug fragment'],
    ['text-ink bg-paper', 'token utilities'],
    ['var(--color-accent)', 'a token reference'],
    ['', 'an empty string'],
    ['#12345', 'a 5-digit string that is not a valid hex colour'],
    ['https://example.com/#top', 'a URL fragment'],
  ])('does not flag %s (%s)', (input) => {
    expect(findRawColor(input)).toBeNull();
  });

  it('ignores non-string values', () => {
    expect(findRawColor(42)).toBeNull();
    expect(findRawColor(null)).toBeNull();
    expect(findRawColor(undefined)).toBeNull();
  });
});
