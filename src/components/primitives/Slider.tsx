import { useId } from 'react';

import { CONTROL_LABEL, CONTROL_READOUT } from './styles';

export interface SliderProps {
  /** What this slider adjusts, in the learner's words. */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Renders the value for display. Default shows the raw number; pass a
   * formatter to add units or fix decimals (`(v) => v.toFixed(2)`).
   */
  format?: (value: number) => string;
  /** Extra context announced to screen readers, e.g. what higher values mean. */
  description?: string;
  disabled?: boolean;
}

/**
 * A labelled range input with a live value readout.
 *
 * Built on the native `input[type=range]` rather than a custom-drawn track:
 * the browser already gives us keyboard support, touch handling, and correct
 * screen reader semantics, none of which a div reimplements well.
 *
 * The readout is not optional chrome. Watching a number move while something
 * else changes IS the lesson, so the current value is always visible.
 */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (v) => String(v),
  description,
  disabled = false,
}: SliderProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  // Drives the filled portion of the track. Guard against a zero-width range,
  // which would otherwise divide by zero and render NaN into the style.
  const span = max - min;
  const fraction = span === 0 ? 0 : (value - min) / span;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={CONTROL_LABEL}>
          {label}
        </label>
        <output htmlFor={id} className={CONTROL_READOUT}>
          {format(value)}
        </output>
      </div>

      <input
        id={id}
        type="range"
        className="instrument-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        style={
          {
            '--slider-fill': `${String(fraction * 100)}%`,
          } as React.CSSProperties
        }
        onChange={(event) => {
          onChange(event.target.valueAsNumber);
        }}
      />

      {description ? (
        <p id={descriptionId} className="text-xs text-ink-faint">
          {description}
        </p>
      ) : null}
    </div>
  );
}
