import { describe, expect, it } from 'vitest';

import { clampToStep } from './stepper-logic';

describe('clampToStep', () => {
  it('leaves a value already on the grid alone', () => {
    expect(clampToStep(4, 0, 10, 1)).toBe(4);
  });

  it('clamps below the minimum and above the maximum', () => {
    expect(clampToStep(-3, 0, 10, 1)).toBe(0);
    expect(clampToStep(99, 0, 10, 1)).toBe(10);
  });

  it('snaps to the nearest step measured from min', () => {
    expect(clampToStep(4.4, 0, 10, 2)).toBe(4);
    expect(clampToStep(5.2, 0, 10, 2)).toBe(6);
  });

  it('measures the grid from min, not from zero', () => {
    expect(clampToStep(6, 1, 11, 5)).toBe(6);
    expect(clampToStep(7, 1, 11, 5)).toBe(6);
    expect(clampToStep(9, 1, 11, 5)).toBe(11);
  });

  it('does not accumulate floating point drift on fractional steps', () => {
    // 0.1 + 0.2 is 0.30000000000000004; the readout must not show that.
    let value = 0;
    for (let i = 0; i < 3; i += 1) value = clampToStep(value + 0.1, 0, 1, 0.1);
    expect(value).toBe(0.3);
  });

  it('handles fractional steps that do not divide the range evenly', () => {
    expect(clampToStep(0.35, 0, 1, 0.25)).toBe(0.25);
    expect(clampToStep(0.4, 0, 1, 0.25)).toBe(0.5);
  });

  it('respects a fractional minimum', () => {
    expect(clampToStep(0.55, 0.05, 1.05, 0.1)).toBe(0.55);
  });

  it('never returns a value outside the range after snapping', () => {
    // Snapping upward from 9 with step 2 would give 11, past the maximum.
    expect(clampToStep(9.9, 0, 10, 2)).toBe(10);
  });

  it('falls back to plain clamping for a non-positive or non-finite step', () => {
    expect(clampToStep(3.7, 0, 10, 0)).toBe(3.7);
    expect(clampToStep(3.7, 0, 10, -1)).toBe(3.7);
    expect(clampToStep(3.7, 0, 10, Number.NaN)).toBe(3.7);
  });
});
