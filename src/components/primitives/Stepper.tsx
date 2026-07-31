import { useId } from 'react';

import { ui } from '../../copy/en';
import { BUTTON_BASE, CONTROL_LABEL, CONTROL_READOUT } from './styles';
import { clampToStep } from './stepper-logic';

export interface StepperProps {
  /** What this counts, in the learner's words. */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  disabled?: boolean;
}

/**
 * A discrete counter: minus, value, plus.
 *
 * Preferred over a Slider whenever the quantity is countable and small — three
 * layers, five tokens — because dragging a continuous track to land on "4"
 * is a worse experience than pressing a button once.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  format = (v) => String(v),
  disabled = false,
}: StepperProps) {
  const id = useId();

  const atMin = value <= min;
  const atMax = value >= max;

  const shift = (direction: 1 | -1) => {
    onChange(clampToStep(value + direction * step, min, max, step));
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span id={id} className={CONTROL_LABEL}>
        {label}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={ui.stepper.decrease(label)}
          disabled={disabled || atMin}
          onClick={() => {
            shift(-1);
          }}
          className={`${BUTTON_BASE} h-7 w-7 text-base leading-none`}
        >
          <span aria-hidden="true">−</span>
        </button>

        {/*
         * `status` so a screen reader announces the new value after a press.
         * Without it the only feedback is visual, and the buttons keep their
         * own labels, so nothing would be spoken at all.
         */}
        <output
          htmlFor={id}
          aria-live="polite"
          className={`${CONTROL_READOUT} min-w-10 text-center`}
        >
          {format(value)}
        </output>

        <button
          type="button"
          aria-label={ui.stepper.increase(label)}
          disabled={disabled || atMax}
          onClick={() => {
            shift(1);
          }}
          className={`${BUTTON_BASE} h-7 w-7 text-base leading-none`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
