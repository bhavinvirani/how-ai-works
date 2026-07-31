/**
 * Pure logic for Stepper, kept separate so it can be tested without a DOM.
 */

/** How many decimal places a number is written with. */
function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) return 0;

  const text = String(n);

  // Exponential notation (1e-7) has no literal decimal point to count.
  const exponent = text.indexOf('e-');
  if (exponent !== -1) {
    const mantissaDecimals = decimalPlaces(Number(text.slice(0, exponent)));
    return mantissaDecimals + Number(text.slice(exponent + 2));
  }

  const point = text.indexOf('.');
  return point === -1 ? 0 : text.length - point - 1;
}

/**
 * Clamp a value into [min, max] and snap it onto the step grid measured from
 * `min`.
 *
 * The rounding pass at the end is not paranoia: stepping 0.1 upward from 0
 * repeatedly gives 0.30000000000000004, which then renders as that in the
 * readout. Rounding to the step's own precision keeps displayed values honest.
 */
export function clampToStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  const clamped = Math.min(Math.max(value, min), max);

  // A non-positive or non-finite step has no grid to snap to.
  if (!Number.isFinite(step) || step <= 0) return clamped;

  const steps = Math.round((clamped - min) / step);
  const snapped = min + steps * step;
  const precision = Math.max(decimalPlaces(step), decimalPlaces(min));
  const rounded = Number(snapped.toFixed(Math.min(precision, 15)));

  return Math.min(Math.max(rounded, min), max);
}
