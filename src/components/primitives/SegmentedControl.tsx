import { useId } from 'react';

import { CONTROL_LABEL } from './styles';

export interface SegmentedOption<T extends string> {
  value: T;
  /** What this choice is, in the learner's words. */
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** What is being chosen between. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * A one-of-several choice, shown as a row of segments.
 *
 * Native radio inputs underneath, visually hidden. That is not a shortcut — it
 * is what gives arrow-key navigation, correct group semantics, and "3 of 5"
 * announcements for free. A div with `role="radiogroup"` has to reimplement
 * every one of those, and usually reimplements them slightly wrong.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className={CONTROL_LABEL}>{label}</legend>

      <div className="inline-flex w-full gap-0.5 rounded-md border border-rule-strong bg-paper-sunken p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer has-disabled:cursor-not-allowed"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => {
                onChange(option.value);
              }}
              className="peer sr-only"
            />
            <span className="block rounded-sm px-2.5 py-1 text-center text-xs font-medium text-ink-muted transition-colors duration-[var(--duration-fast)] ease-out-soft peer-checked:bg-paper-raised peer-checked:text-ink peer-checked:shadow-sheet peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
